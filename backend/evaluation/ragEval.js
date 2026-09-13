// backend/evaluation/ragEval.js
// Baseline RAG Retrieval Evaluation Script for Campus Connect
// Strictly separates:
// 1. Diagnostic Top-10 Ranking Metrics (unconstrained: topK=10, minSimilarity=0.0, maxChunksPerPost=1)
// 2. Production-Threshold Behavior (exact assistant parameters: topK=5, minSimilarity=0.68, maxChunksPerPost=2)

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../config/db');
const { getEmbedding, retrieveRelevantPosts, inferCategory } = require('../controllers/assistantController');
const { EVALUATION_QUERIES } = require('./evalQueries');

const PRODUCTION_ASSISTANT_THRESHOLD = 0.68; // Current production threshold in askAssistant

function pad(str, len, align = 'left') {
  const s = String(str ?? '');
  if (s.length >= len) return s.slice(0, len);
  return align === 'right' ? s.padStart(len, ' ') : s.padEnd(len, ' ');
}

async function runEvaluation() {
  console.log('================================================================================');
  console.log('               CAMPUS CONNECT - BASELINE RAG RETRIEVAL EVALUATION                ');
  console.log('================================================================================\n');

  const diagnosticResults = [];
  const productionResults = [];
  const unanswerableResults = [];
  const failures = [];

  for (const qObj of EVALUATION_QUERIES) {
    const { id, query, relevantPostIds } = qObj;
    const isAnswerable = relevantPostIds.length > 0;
    const relevantSet = new Set(relevantPostIds);

    // Step 1: Query vector generation
    const queryEmbedding = await getEmbedding(query, 'RETRIEVAL_QUERY');

    // Step 2: Production category inference
    const category = inferCategory(query);

    // Step 3: Diagnostic Top-10 Candidate Retrieval (minSimilarity=0.0, maxChunksPerPost=1)
    const rawDiagnostic = await retrieveRelevantPosts(queryEmbedding, 10, category, 0.0, 1);

    // Diagnostic post-level deduplication
    const diagSeen = new Set();
    const diagRankedPosts = [];
    for (const item of rawDiagnostic) {
      if (!diagSeen.has(item.post_id)) {
        diagSeen.add(item.post_id);
        diagRankedPosts.push(item);
      }
    }

    // Calculate TRUE maximum similarity across all retrieved candidates
    const allSimilarities = diagRankedPosts.map(p => Number(p.similarity));
    const trueMaxSimilarity = allSimilarities.length > 0 ? Math.max(...allSimilarities) : 0;

    // Step 4: Exact Production Retrieval (topK=5, minSimilarity=0.68, maxChunksPerPost=2)
    // Uses the identical invocation as askAssistant
    const prodRaw = await retrieveRelevantPosts(queryEmbedding, 5, category, PRODUCTION_ASSISTANT_THRESHOLD, 2);

    // Production post-level deduplication for metric evaluation
    const prodSeen = new Set();
    const prodRankedPosts = [];
    for (const item of prodRaw) {
      if (!prodSeen.has(item.post_id)) {
        prodSeen.add(item.post_id);
        prodRankedPosts.push(item);
      }
    }

    // Production gate evaluation (identical to askAssistant line 89)
    const productionPassedGate = prodRaw.length > 0 && Number(prodRaw[0].similarity) >= PRODUCTION_ASSISTANT_THRESHOLD;

    // --- Individual Query Printout ---
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[${id}] Question: "${query}"`);
    console.log(`Expected Relevant Post IDs: [${relevantPostIds.join(', ')}]`);
    console.log(`Inferred Category: ${category || 'None (no category boost)'}`);
    console.log(`True Max Similarity: ${trueMaxSimilarity.toFixed(3)} | Threshold: ${PRODUCTION_ASSISTANT_THRESHOLD}`);
    console.log(`Production 0.68 Gate Status: ${productionPassedGate ? 'PASSED (Answer Generated)' : 'BLOCKED (Insufficient Context Empty State)'}`);
    console.log(`Production Returned Posts: [${prodRankedPosts.map(p => `Post ${p.post_id}`).join(', ') || 'None'}]`);
    console.log(`\nTop Retrieved Posts (Diagnostic Top-10):`);
    console.log(`Rank | Post ID | ${pad('Title', 46)} | Sim   | Score | Relevant | Gate>=0.68`);
    console.log(`-----+---------+${'-'.repeat(48)}+-------+-------+----------+-----------`);

    diagRankedPosts.forEach((post, idx) => {
      const rank = idx + 1;
      const isRel = relevantSet.has(post.post_id);
      const relStr = isRel ? 'YES' : 'NO';
      const simVal = Number(post.similarity);
      const simStr = simVal.toFixed(3);
      const scoreStr = Number(post.score).toFixed(3);
      const gateStr = simVal >= PRODUCTION_ASSISTANT_THRESHOLD ? 'YES' : 'no';
      console.log(
        `${pad(rank, 4, 'right')} | ${pad(post.post_id, 7, 'right')} | ${pad(post.title, 46)} | ${simStr} | ${scoreStr} | ${pad(relStr, 8)} | ${gateStr}`
      );
    });

    if (diagRankedPosts.length === 0) {
      console.log('   (No diagnostic posts retrieved)');
    }
    console.log();

    if (isAnswerable) {
      // -------------------------------------------------------------
      // 1. Diagnostic Metrics (Unconstrained Top-10 Ranking)
      // -------------------------------------------------------------
      const top1Post = diagRankedPosts[0];
      const diagHitAt1 = top1Post && relevantSet.has(top1Post.post_id) ? 1 : 0;

      const top3Posts = diagRankedPosts.slice(0, 3);
      const diagHitAt3 = top3Posts.some(p => relevantSet.has(p.post_id)) ? 1 : 0;

      const top5Posts = diagRankedPosts.slice(0, 5);
      const diagRelInTop5 = top5Posts.filter(p => relevantSet.has(p.post_id)).length;
      const diagPrecisionAt5 = diagRelInTop5 / 5;

      const top10Posts = diagRankedPosts.slice(0, 10);
      const diagRelInTop10 = top10Posts.filter(p => relevantSet.has(p.post_id)).length;
      const diagRecallAt10 = relevantSet.size > 0 ? diagRelInTop10 / relevantSet.size : 0;

      let diagReciprocalRank = 0;
      for (let i = 0; i < diagRankedPosts.length; i++) {
        if (relevantSet.has(diagRankedPosts[i].post_id)) {
          diagReciprocalRank = 1 / (i + 1);
          break;
        }
      }

      diagnosticResults.push({
        id,
        query,
        relevantPostIds,
        hitAt1: diagHitAt1,
        hitAt3: diagHitAt3,
        precisionAt5: diagPrecisionAt5,
        recallAt10: diagRecallAt10,
        reciprocalRank: diagReciprocalRank,
        topPost: top1Post,
        trueMaxSimilarity,
      });

      // -------------------------------------------------------------
      // 2. Production-Threshold Metrics (Exact Assistant Invocation)
      // -------------------------------------------------------------
      let prodHitAt1 = 0;
      let prodHitAt3 = 0;
      let prodRelInTop5 = 0;
      let prodRecall = 0;

      if (productionPassedGate) {
        const prodTop1 = prodRankedPosts[0];
        prodHitAt1 = prodTop1 && relevantSet.has(prodTop1.post_id) ? 1 : 0;
        prodHitAt3 = prodRankedPosts.slice(0, 3).some(p => relevantSet.has(p.post_id)) ? 1 : 0;
        prodRelInTop5 = prodRankedPosts.slice(0, 5).filter(p => relevantSet.has(p.post_id)).length;
        prodRecall = relevantSet.size > 0 ? prodRelInTop5 / relevantSet.size : 0;
      }

      productionResults.push({
        id,
        passedGate: productionPassedGate,
        hitAt1: prodHitAt1,
        hitAt3: prodHitAt3,
        precisionAt5: prodRelInTop5 / 5,
        recall: prodRecall,
      });

      // Failure Analysis for Answerable Queries
      const queryFailures = [];
      if (!diagHitAt1) {
        queryFailures.push('Diagnostic Hit@1 failed: Rank 1 post is not relevant.');
      }
      if (!diagHitAt3) {
        queryFailures.push('Diagnostic Hit@3 failed: No relevant post in top 3.');
      }
      if (top1Post && !relevantSet.has(top1Post.post_id) && Number(top1Post.similarity) >= 0.70) {
        queryFailures.push(`High-confidence intruder: Irrelevant Post ${top1Post.post_id} ("${top1Post.title}") ranked #1 with similarity ${Number(top1Post.similarity).toFixed(3)}.`);
      }
      if (!productionPassedGate) {
        queryFailures.push(`False Rejection under 0.68 threshold: Query has relevant posts, but production retriever returned 0 candidates or top candidate < 0.68 (True Max Sim: ${trueMaxSimilarity.toFixed(3)}), triggering empty-state.`);
      }

      if (queryFailures.length > 0) {
        failures.push({
          id,
          query,
          expected: relevantPostIds,
          topRetrieved: top1Post ? `Post ${top1Post.post_id} ("${top1Post.title}") [Sim: ${Number(top1Post.similarity).toFixed(3)}, Score: ${Number(top1Post.score).toFixed(3)}]` : 'None',
          trueMaxSimilarity: trueMaxSimilarity.toFixed(3),
          productionPassed: productionPassedGate,
          reasons: queryFailures,
        });
      }

    } else {
      // -------------------------------------------------------------
      // 3. Unanswerable Query Evaluation (Q29, Q30)
      // -------------------------------------------------------------
      const highestSimPost = diagRankedPosts.reduce((maxP, p) => Number(p.similarity) > Number(maxP?.similarity || 0) ? p : maxP, diagRankedPosts[0]);
      const hasAnyAboveThreshold = trueMaxSimilarity >= PRODUCTION_ASSISTANT_THRESHOLD;

      unanswerableResults.push({
        id,
        query,
        trueMaxSimilarity,
        highestSimPost,
        hasAnyAboveThreshold,
        passedGate: productionPassedGate,
        prodCount: prodRankedPosts.length,
      });

      if (hasAnyAboveThreshold || productionPassedGate) {
        failures.push({
          id,
          query,
          expected: [],
          topRetrieved: `Post ${highestSimPost?.post_id} ("${highestSimPost?.title}") [Sim: ${trueMaxSimilarity.toFixed(3)}]`,
          trueMaxSimilarity: trueMaxSimilarity.toFixed(3),
          productionPassed: productionPassedGate,
          reasons: [`Unanswerable query falsely passed 0.68 threshold: Post ${highestSimPost?.post_id} achieved similarity ${trueMaxSimilarity.toFixed(3)} >= ${PRODUCTION_ASSISTANT_THRESHOLD}, passing the assistant gate with ${prodRankedPosts.length} posts.`],
        });
      }
    }
  }

  // Summary Metrics
  const numAnswerable = diagnosticResults.length;

  const diagAvgHit1 = diagnosticResults.reduce((a, r) => a + r.hitAt1, 0) / numAnswerable;
  const diagAvgHit3 = diagnosticResults.reduce((a, r) => a + r.hitAt3, 0) / numAnswerable;
  const diagAvgP5 = diagnosticResults.reduce((a, r) => a + r.precisionAt5, 0) / numAnswerable;
  const diagAvgR10 = diagnosticResults.reduce((a, r) => a + r.recallAt10, 0) / numAnswerable;
  const diagAvgMRR = diagnosticResults.reduce((a, r) => a + r.reciprocalRank, 0) / numAnswerable;

  const prodPassedCount = productionResults.filter(r => r.passedGate).length;
  const prodGatedHit1 = productionResults.reduce((a, r) => a + r.hitAt1, 0) / numAnswerable;
  const prodGatedHit3 = productionResults.reduce((a, r) => a + r.hitAt3, 0) / numAnswerable;
  const prodGatedP5 = productionResults.reduce((a, r) => a + r.precisionAt5, 0) / numAnswerable;
  const prodGatedRecall = productionResults.reduce((a, r) => a + r.recall, 0) / numAnswerable;

  console.log('================================================================================');
  console.log('                    OVERALL BASELINE RETRIEVAL EVALUATION REPORT                 ');
  console.log('================================================================================\n');

  console.log('SECTION 1: DIAGNOSTIC RANKING METRICS (Unconstrained Top-10 Ranking, minSim=0.0)');
  console.log('--------------------------------------------------------------------------------');
  console.log(`Evaluated Answerable Queries : ${numAnswerable} (Q1 to Q28)`);
  console.log(`Diagnostic Hit@1             : ${(diagAvgHit1 * 100).toFixed(2)}% (${diagnosticResults.filter(r => r.hitAt1).length}/${numAnswerable})`);
  console.log(`Diagnostic Hit@3             : ${(diagAvgHit3 * 100).toFixed(2)}% (${diagnosticResults.filter(r => r.hitAt3).length}/${numAnswerable})`);
  console.log(`Diagnostic Precision@5       : ${(diagAvgP5 * 100).toFixed(2)}%`);
  console.log(`Diagnostic Recall@10         : ${(diagAvgR10 * 100).toFixed(2)}%`);
  console.log(`Diagnostic MRR               : ${diagAvgMRR.toFixed(4)}\n`);

  console.log('SECTION 2: PRODUCTION ASSISTANT BEHAVIOR (topK=5, minSimilarity=0.68, maxChunks=2)');
  console.log('--------------------------------------------------------------------------------');
  console.log(`Assistant Cutoff Threshold   : ${PRODUCTION_ASSISTANT_THRESHOLD}`);
  console.log(`Answerable Queries Passed    : ${((prodPassedCount / numAnswerable) * 100).toFixed(2)}% (${prodPassedCount}/${numAnswerable} passed the 0.68 gate)`);
  console.log(`False Rejection Rate         : ${(((numAnswerable - prodPassedCount) / numAnswerable) * 100).toFixed(2)}% (${numAnswerable - prodPassedCount}/${numAnswerable} answerable queries blocked by 0.68 threshold)`);
  console.log(`Production Gated Hit@1       : ${(prodGatedHit1 * 100).toFixed(2)}% (${productionResults.filter(r => r.hitAt1).length}/${numAnswerable})`);
  console.log(`Production Gated Hit@3       : ${(prodGatedHit3 * 100).toFixed(2)}% (${productionResults.filter(r => r.hitAt3).length}/${numAnswerable})`);
  console.log(`Production Gated Precision@5 : ${(prodGatedP5 * 100).toFixed(2)}%`);
  console.log(`Production Gated Recall      : ${(prodGatedRecall * 100).toFixed(2)}%\n`);

  console.log('SECTION 3: UNANSWERABLE QUERIES EVALUATION (Q29, Q30)');
  console.log('--------------------------------------------------------------------------------');
  console.log(`Expected Behavior: Blocked by 0.68 threshold (triggering empty-state abstention)\n`);

  unanswerableResults.forEach(u => {
    const isCorrect = !u.passedGate && !u.hasAnyAboveThreshold;
    const verdict = isCorrect ? 'CORRECT REJECTION (Passed)' : 'FALSE POSITIVE LEAK (Failed)';
    console.log(`[${u.id}] Query: "${u.query}"`);
    console.log(`   Highest-Similarity Post : Post ${u.highestSimPost?.post_id} ("${u.highestSimPost?.title}")`);
    console.log(`   True Maximum Similarity : ${u.trueMaxSimilarity.toFixed(3)} | Cutoff: ${PRODUCTION_ASSISTANT_THRESHOLD}`);
    console.log(`   Production Gate Passed  : ${u.passedGate ? 'YES' : 'NO'}`);
    console.log(`   Evaluation Result       : ${verdict}\n`);
  });

  console.log('SECTION 4: FAILURE ANALYSIS');
  console.log('--------------------------------------------------------------------------------');
  if (failures.length === 0) {
    console.log('No failures or anomalies detected.\n');
  } else {
    console.log(`Total queries flagged with issues: ${failures.length}\n`);
    failures.forEach((f, idx) => {
      console.log(`[${idx + 1}] Query ${f.id}: "${f.query}"`);
      console.log(`    Expected Relevant IDs : [${f.expected.join(', ')}]`);
      console.log(`    Top Retrieved         : ${f.topRetrieved}`);
      console.log(`    True Max Similarity   : ${f.trueMaxSimilarity}`);
      console.log(`    Production Passed Gate: ${f.productionPassed ? 'YES' : 'NO'}`);
      console.log(`    Issues Identified     :`);
      f.reasons.forEach(r => console.log(`      - ${r}`));
      console.log();
    });
  }

  await pool.end();
}

runEvaluation().catch(err => {
  console.error('Fatal evaluation error:', err);
  process.exit(1);
});

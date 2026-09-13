require('dotenv').config();
const pool = require('../config/db');
const { embedPost } = require('../controllers/assistantController');
const bcrypt = require('bcrypt');

const POSTS_DATA = [
  {
    id: 13,
    title: "my experience at JPMC Code For Good (CFG) this year",
    category: "Placements & Internships",
    author: { username: "aditya_comps", year: 4, branch: "Computer Engineering" },
    content: `Writing this down because a bunch of people were asking about the CFG hackathon format.

First there was an online coding round on HackerRank. For our slot it was mostly array manipulation and a greedy question. After that came a video interview on HireVue where you record short answers to situational questions like handling deadlines and team conflicts.

The actual hackathon was pretty intense. You get grouped with students from different colleges and assigned an NGO problem statement. Honestly, what our mentors seemed to focus on throughout the night wasn't whether we had the most complex machine learning model, but how our team actually worked together. They watched our git commit history, listened in on our discussions, and noticed who was helping unblock others when things broke at 3 AM.

My advice: don't try to dominate the group or write all the code alone. Show you're easy to collaborate with, ask your mentors sensible questions during check-ins, and keep your pitch simple. It’s tiring and you barely sleep, but definitely one of the best hiring experiences on campus.`
  },
  {
    id: 14,
    title: "quick heads up about JPMC technical OA",
    category: "Placements & Internships",
    author: { username: "tanvi_it", year: 4, branch: "Information Technology" },
    content: `Just wanted to clear up some confusion since people were practicing speed-math for the JPMC test. At least for our slot, there was no aptitude or general English section at all. It was just 2 DSA questions on HackerRank.

One problem was around sliding window / prefix sum and the other was a tree traversal problem. What caught a few of my friends was hidden edge cases and large input constraints causing time-limit-exceeded (TLE).

If you’re prepping, stick to medium DSA problems on LeetCode especially arrays, hashmaps, and basic trees. Don't waste time memorizing quant formulas for this one.`
  },
  {
    id: 15,
    title: "got a ninja offer? try for the tcs digital upgrade",
    category: "Placements & Internships",
    author: { username: "prathamesh_extc", year: 4, branch: "Electronics and Telecommunication" },
    content: `If you cleared NQT and ended up with a standard Ninja role, definitely look out for the internal upgrade opportunity (they usually announce a test or challenge later).

The upgrade test is noticeably tougher than standard NQT. In our slot the coding section had two questions, one was recursion/strings and the other was dynamic programming. Also the coding environment was super sensitive about standard input formatting and trailing spaces, so test your I/O logic carefully.

Even if you already have a backup offer, practicing for the upgrade test is worth the extra effort since the Digital role has much better project allocation and compensation.`
  },
  {
    id: 16,
    title: "Cognizant GenC Elevate interview questions from my slot",
    category: "Placements & Internships",
    author: { username: "neha_comps", year: 4, branch: "Computer Engineering" },
    content: `Had my Elevate interview yesterday. Unlike the regular GenC round which is mostly aptitude and communication, Elevate had live technical questions.

The interviewer asked me to share my screen and write code to reverse a string word by word, and then asked how hash collision resolution works internally. After that a couple of SQL questions on joins and finding duplicates without using DISTINCT.

The panel was pretty chill, just be ready to talk through your logic while typing and know your basic OOPs concepts well.`
  },
  {
    id: 17,
    title: "DSA for placements vs college sem exams (stop studying the same way for both)",
    category: "Placements & Internships",
    author: { username: "harsh_comps", year: 4, branch: "Computer Engineering" },
    content: `I see so many 2nd and 3rd years confused why they have an 8.5 pointer in college Data Structures but keep getting stuck in company OAs and technical interviews.

College exams test if you can manually trace a sorting algorithm on an answer sheet, explain the definition of an AVL tree, or write neat pseudocode. But company coding tests give you an ambiguous word problem and expect you to immediately spot whether it’s a two-pointer problem, a monotonic stack, or BFS.

If your goal is cracking off-campus or on-campus tech drives:
- Pick one language (C++ or Java) and get really fast with its standard library / collections.
- Pick a structured list like Blind 75 or Striver's sheet and focus on problem patterns rather than randomly solving 400 easy questions.
- Always think about edge cases (empty inputs, large values, duplicate elements).

Semester exams just require passing marks and neat theory; placement tests require problem pattern recognition under a timer.`
  },
  {
    id: 18,
    title: "how to easily clear SPIT DSA theory exam",
    category: "Academics & Notes",
    author: { username: "rohit_it", year: 3, branch: "Information Technology" },
    content: `For anyone panicking about the end-sem DSA paper: you do not need to be a competitive programmer to score well in the college exam.

The question paper follows a very predictable pattern:
1. Tracing sorting algorithms step by step (keep your diagrams neat).
2. AVL tree rotations (LL, RR, LR, RL) — practice drawing balance factors on paper.
3. Infix to postfix conversion using a stack table.
4. Standard graph algorithms like Dijkstra or Prim’s with the cost table.

Focus on previous year papers from the library or senior drives. Draw clean diagrams, write proper algorithm steps with time complexity, and you will easily secure a solid grade without touching LeetCode.`
  },
  {
    id: 19,
    title: "making your DBMS project look like real engineering on your resume",
    category: "Professors & Courses",
    author: { username: "priya_comps", year: 3, branch: "Computer Engineering" },
    content: `Almost every resume in our batch had a generic hotel booking or student record system using raw SQL. During one interview, the interviewer literally smiled and said "another college DBMS project."

That made me rebuild mine and here's what actually sparked interesting conversations in later interviews:
- Instead of just dumping queries, I explained why I normalized tables to 3NF and where I deliberately kept a redundant count column for fast reads.
- Added proper PostgreSQL indexes and ran EXPLAIN ANALYZE to show how query execution time changed on a table with 50,000 generated dummy rows.
- Talked about database transactions: how we wrapped order placement and inventory reduction in a single BEGIN / COMMIT block so money isn't deducted if the server crashes midway.

Interviewers don't expect you to build Oracle, but showing that you understand indexes, foreign keys, and transaction integrity makes your project sound 10x more mature.`
  },
  {
    id: 20,
    title: "what the external examiner asked in our DBMS viva today",
    category: "Academics & Notes",
    author: { username: "vikas_it", year: 3, branch: "Information Technology" },
    content: `Just finished the DBMS lab exam and viva. Sharing the questions while they are fresh in my head.

The external asked:
- Difference between clustered and non-clustered indexes.
- Why we need HAVING when WHERE already exists.
- An example of a deletion anomaly from an unnormalized table.
- A quick SQL query on the spot to fetch employees earning more than the average salary in their department.

Make sure your lab journal is completely signed and you actually know how your mini-project tables are linked. If you blank out, stay calm and explain the intuition rather than going completely silent.`
  },
  {
    id: 21,
    title: "3rd year ML elective honest review (math heavy!)",
    category: "Professors & Courses",
    author: { username: "sahil_comps", year: 4, branch: "Computer Engineering" },
    content: `Before you fill out elective forms for next semester, be aware that the Machine Learning course has a lot of theory and math.

A lot of folks took it thinking we'd immediately start building cool neural network apps, but the first half of the syllabus is heavily based on linear algebra, eigenvalues, gradient descent derivations, and probability distributions. If you dislike math proofs, you might find the lectures and mid-sem exams quite tedious.

That said, the lab assignments with scikit-learn and pandas were genuinely practical, and you end up implementing decision trees, SVMs, and regression from scratch. It builds solid fundamentals if you actually want to understand what ML models are doing under the hood, but don't expect a lightweight elective.`
  },
  {
    id: 22,
    title: "cloud computing elective — thoughts after taking it",
    category: "Professors & Courses",
    author: { username: "ananya_it", year: 4, branch: "Information Technology" },
    content: `Took Cloud Computing last semester. Overall it was one of the more useful electives, especially the lab sessions where we got AWS accounts to deploy simple EC2 instances, configure S3 buckets, and play around with IAM permissions.

The only downside is that the end-sem theory paper had a lot of dry descriptive questions memorizing NIST definitions, cloud deployment models, and virtualization types.

My tip: enjoy the hands-on lab work because it gives you real talking points for DevOps or backend interviews, but don't ignore the theory slides a few days before the final exam.`
  },
  {
    id: 23,
    title: "what worked for me when cold emailing for off-campus summer internships",
    category: "Placements & Internships",
    author: { username: "karan_comps", year: 3, branch: "Computer Engineering" },
    content: `In 2nd year I was desperate to find an internship before 3rd year placements started. After getting zero responses on standard job boards, I started cold reaching out directly to engineering leads and founders at smaller startups.

A few things that actually helped get replies:
- Kept the message under 4 or 5 sentences. Nobody has time to read a cover letter on LinkedIn or email.
- Linked a live deployed project right in the second line. Saying "I built this tool with React and Node, here is the live link" works infinitely better than saying "I am a quick learner passionate about tech."
- Pointed out a small issue or suggested a small feature on their public app or GitHub repo.

Most people still won't reply because they’re busy, but personalized emails with proof of work got me way more traction than blindly submitting resumes on career portals.`
  },
  {
    id: 24,
    title: "how to ask seniors for referrals without being awkward",
    category: "General",
    author: { username: "rhea_it", year: 4, branch: "Information Technology" },
    content: `As a 4th year, I've had juniors message me on LinkedIn just saying "refer me" with no job link or background. Please don't do this!

If you want a senior or alum to help you:
1. Search the company career portal first and send the exact Job ID/link.
2. Mention your branch, graduation year, and that you're from SPIT.
3. Write a brief 2-sentence summary of your stack and relevant projects.
4. Attach a clean resume link (make sure Google Drive access is set to public viewer!).

Seniors genuinely want to help SPIT folks get in, but make it easy for them to just forward your profile to their internal portal.`
  },
  {
    id: 25,
    title: "best places to study on campus when library is completely packed",
    category: "Campus Life",
    author: { username: "sid_extc", year: 3, branch: "Electronics and Telecommunication" },
    content: `During exam season the central library gets crowded by 10 AM and people leave bags on chairs to reserve desks all day. If you need quiet spots with good light or sockets:

- 5th floor reading space in the new building: usually much calmer than the main library and there are charging sockets along the wall if you need your laptop.
- The lake side benches near Bhavans: really pleasant early in the morning between 8 AM and 9 AM before the afternoon heat. No charging points obviously, so download notes beforehand.
- Empty classrooms on the 3rd floor: between 1 PM and 3 PM some classrooms are free between lecture slots. Great for working on group presentations with friends without whispering.

Just avoid the canteen if you actually need to concentrate, way too much noise and people dropping by.`
  },
  {
    id: 26,
    title: "canteen food vs khau galli outside gate",
    category: "Campus Life",
    author: { username: "rahul_comps", year: 2, branch: "Computer Engineering" },
    content: `Quick food review for 1st years figuring out lunch options.

The college canteen vadapav is solid and cheap when you only have a 10-minute break between practicals. But if you have an hour-long break, walking out to Bhavans Khau Galli along Munshi Nagar is 100% worth it. You get way better frankies, dosas, and fresh juice.

Also SPCE canteen has decent thalis if you want an actual proper meal instead of snacks.`
  },
  {
    id: 27,
    title: "fest committees in 2nd year — Oculus vs technical clubs?",
    category: "Campus Life",
    author: { username: "simran_extc", year: 2, branch: "Electronics and Telecommunication" },
    content: `A lot of juniors were asking whether joining Oculus or technical committees like Matrix/CSI is worth the time commitment.

Here’s my perspective after doing both:
If you want to improve confidence, talk to sponsors, manage crowds, and experience the crazy buzz of a college fest, Oculus is super fun. You make a lot of friends across departments.

If your primary goal is finding coding partners, working on web projects, or learning about hackathons, technical committees give you direct access to seniors who are already cracked at development and placements.

Just be realistic about your attendance. Fest work ramps up heavily close to event week, so don't let your lab submissions slip.`
  },
  {
    id: 28,
    title: "tech interview notes for investment banks (OOPs, LLD, concurrency)",
    category: "Placements & Internships",
    author: { username: "dev_comps", year: 4, branch: "Computer Engineering" },
    content: `For tech roles at banks like Morgan Stanley, JPMC, or Nomura, interviewers often move past pure LeetCode in round 2 and dig into your understanding of software design and operating system concepts.

Things they asked me or my friends this year:
- Design patterns: explain Singleton and how to make it thread-safe. Where would you use Factory pattern vs Strategy pattern?
- OOPs in practice: not just book definitions, but explaining why interfaces help with dependency injection and unit testing.
- Concurrency basics: difference between processes and threads, what causes deadlocks, and what synchronized keywords or mutex locks actually do.
- ACID properties: specifically what database isolation levels mean and how dirty reads happen.

Review these topics alongside your coding practice so you don't get caught off guard when the interview shifts from algorithms to core engineering fundamentals.`
  },
  {
    id: 29,
    title: "attendance & medical leave rules — don't ignore this until submission week",
    category: "Academics & Notes",
    author: { username: "manish_it", year: 3, branch: "Information Technology" },
    content: `Friendly reminder to freshers: do not take the 75% attendance rule lightly at SPIT.

Every semester people think profs are bluffing, and then defaulter lists come out right before submissions. Labs are especially strict — missing even two lab turns can land you on the defaulter list because each lab session carries significant term-work weight.

If you are genuinely unwell, get a physical doctor's certificate and submit the application letter to your department within a few days. Don't wait until the last week of the semester to bring a bunch of medical leaves all at once because HODs rarely accept backdated medicals at the end.`
  },
  {
    id: 30,
    title: "resume mistakes I noticed while helping with placement reviews",
    category: "Placements & Internships",
    author: { username: "aniket_comps", year: 4, branch: "Computer Engineering" },
    content: `Helped review a bunch of junior resumes recently and noticed some common issues:

- Fancy Canva templates with skill bars and two columns look nice visually, but ATS parsers often scramble the text and sections. Stick to standard clean single-column templates (Overleaf / Jake's resume format is widely used for a reason).
- Vague project bullets: writing "built a website using React" says almost nothing. Try to explain what the app actually does, what tech choices you made, and any performance or feature highlights.
- Listing every buzzword under the sun: if you put Docker or Kubernetes on your resume, interviewers will ask you how containers differ from VMs or how you configured networking. If you only watched a tutorial, it’s safer to list it under familiar tools or leave it off.

Keep it to one page, check for typos in tech names, and make sure your project links actually work.`
  }
];

async function seed() {
  const errors = [];
  try {
    console.log('--- Step 1: Generating valid bcrypt hash for synthetic users ---');
    // Using project's existing bcrypt dependency to generate valid hash for dummy test password
    const dummyPasswordHash = await bcrypt.hash('dummyTestPass@123', 10);

    for (const post of POSTS_DATA) {
      const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [post.author.username]);
      let userId;
      if (userCheck.rows.length === 0) {
        const userInsert = await pool.query(
          `INSERT INTO users (username, email, password_hash, year, branch, role)
           VALUES ($1, $2, $3, $4, $5, 'student')
           RETURNING id`,
          [
            post.author.username,
            `${post.author.username}@spit.ac.in`,
            dummyPasswordHash,
            post.author.year,
            post.author.branch
          ]
        );
        userId = userInsert.rows[0].id;
        console.log(`Created user ${post.author.username} with valid bcrypt hash (ID: ${userId})`);
      } else {
        userId = userCheck.rows[0].id;
        // Update password_hash to the freshly generated valid bcrypt hash
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [dummyPasswordHash, userId]);
      }
      post.userId = userId;
    }

    console.log('\n--- Step 2: Ensuring Posts 13-30 exist ---');
    for (const post of POSTS_DATA) {
      const existing = await pool.query('SELECT id FROM posts WHERE id = $1', [post.id]);
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO posts (id, user_id, title, content, category)
           VALUES ($1, $2, $3, $4, $5)`,
          [post.id, post.userId, post.title, post.content, post.category]
        );
        console.log(`Inserted post ${post.id}: "${post.title}"`);
      }
    }

    // Keep sequence in sync with max id
    await pool.query("SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts))");

    console.log('\n--- Step 3: Running standard chunking & embedding flow for Posts 13-30 ---');
    for (const post of POSTS_DATA) {
      try {
        await embedPost(post.id, post.title, post.content);
        console.log(`✅ Embedded chunks for post ${post.id}: "${post.title}"`);
      } catch (err) {
        console.error(`❌ Error embedding post ${post.id}:`, err.message);
        errors.push({ postId: post.id, error: err.message });
      }
    }

    console.log('\n--- Step 4: Verification Queries ---');

    // 1. Total posts
    const totalPostsRes = await pool.query('SELECT COUNT(*) FROM posts');
    const totalPosts = parseInt(totalPostsRes.rows[0].count, 10);

    // 2. Total post_chunks
    const totalChunksRes = await pool.query('SELECT COUNT(*) FROM post_chunks');
    const totalChunks = parseInt(totalChunksRes.rows[0].count, 10);

    // 3. Number of chunks for each post 13-30
    const chunksPerPostRes = await pool.query(
      `SELECT post_id, COUNT(*) as chunk_count
       FROM post_chunks
       WHERE post_id BETWEEN 13 AND 30
       GROUP BY post_id
       ORDER BY post_id ASC`
    );

    // 4. Valid 3072-dimension embeddings count for new chunks
    const dimCheckRes = await pool.query(
      `SELECT 
         COUNT(*) as total_new_chunks,
         COUNT(CASE WHEN vector_dims(embedding) = 3072 THEN 1 END) as valid_dims_count
       FROM post_chunks
       WHERE post_id BETWEEN 13 AND 30`
    );
    const validDimsCount = parseInt(dimCheckRes.rows[0].valid_dims_count, 10);
    const totalNewChunks = parseInt(dimCheckRes.rows[0].total_new_chunks, 10);

    // 5. Zero-chunk posts
    const postWithZeroChunksRes = await pool.query(
      `SELECT p.id
       FROM posts p
       LEFT JOIN post_chunks pc ON p.id = pc.post_id
       WHERE pc.id IS NULL`
    );
    const zeroChunkPosts = postWithZeroChunksRes.rows.map(r => r.id);

    console.log('\n========================================');
    console.log(`1. Total posts: ${totalPosts}`);
    console.log(`2. Total post_chunks: ${totalChunks}`);
    console.log('3. Chunks per posts 13-30:');
    chunksPerPostRes.rows.forEach(r => {
      console.log(`   Post ${r.post_id}: ${r.chunk_count} chunk(s)`);
    });
    console.log(`4. Valid 3072-dimension embeddings count: ${validDimsCount} / ${totalNewChunks}`);
    console.log(`5. Zero-chunk posts: ${zeroChunkPosts.length > 0 ? zeroChunkPosts.join(', ') : 'None'}`);
    console.log(`6. Errors: ${errors.length > 0 ? JSON.stringify(errors) : 'None'}`);
    console.log('========================================');

  } catch (err) {
    console.error('Seed script error:', err);
    errors.push({ fatal: err.message });
  } finally {
    await pool.end();
  }
}

seed();

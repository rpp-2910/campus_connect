// backend/evaluation/evalQueries.js
// Evaluation dataset: 30 frozen queries with ground truth relevant post IDs

const EVALUATION_QUERIES = [
  {
    id: "Q1",
    query: "What happens during campus placements from registration until getting an offer?",
    relevantPostIds: [12]
  },
  {
    id: "Q2",
    query: "What subjects and topics should I prepare for technical placement interviews?",
    relevantPostIds: [2, 4, 12, 14, 16, 17, 19, 20, 28]
  },
  {
    id: "Q3",
    query: "How should I prepare for coding OAs for placements?",
    relevantPostIds: [2, 4, 13, 14, 15, 17]
  },
  {
    id: "Q4",
    query: "How should I prepare specifically for TCS NQT?",
    relevantPostIds: [2, 3, 15]
  },
  {
    id: "Q5",
    query: "What is the difference between Cognizant GenC and TCS NQT?",
    relevantPostIds: [2, 3, 16]
  },
  {
    id: "Q6",
    query: "I got a TCS Ninja offer. How can I prepare for a better TCS role?",
    relevantPostIds: [2, 15, 17]
  },
  {
    id: "Q7",
    query: "What should I prepare for the JPMC technical OA?",
    relevantPostIds: [4, 13, 14, 17]
  },
  {
    id: "Q8",
    query: "What happens during JPMC Code For Good and how should I behave during the hackathon?",
    relevantPostIds: [13]
  },
  {
    id: "Q9",
    query: "What kind of technical questions can Cognizant ask in an interview?",
    relevantPostIds: [3, 4, 16, 17]
  },
  {
    id: "Q10",
    query: "How should I prepare DSA for placements instead of college exams?",
    relevantPostIds: [2, 4, 14, 15, 17, 18]
  },
  {
    id: "Q11",
    query: "What should I study for my college DSA theory exam?",
    relevantPostIds: [4, 6, 18]
  },
  {
    id: "Q12",
    query: "Do I need LeetCode for my DSA semester exam or should I study differently?",
    relevantPostIds: [4, 6, 17, 18]
  },
  {
    id: "Q13",
    query: "What DBMS topics should I prepare for exams and viva?",
    relevantPostIds: [9, 19, 20]
  },
  {
    id: "Q14",
    query: "What SQL and database concepts are useful for technical interviews?",
    relevantPostIds: [9, 16, 19, 20, 28]
  },
  {
    id: "Q15",
    query: "How can I make my DBMS project strong enough to discuss in interviews?",
    relevantPostIds: [9, 19, 28]
  },
  {
    id: "Q16",
    query: "I want to learn SQL joins, normalization, indexes and transactions. Which posts can help?",
    relevantPostIds: [9, 16, 19, 20, 28]
  },
  {
    id: "Q17",
    query: "Should I choose ML or Cloud Computing as my elective?",
    relevantPostIds: [5, 21, 22]
  },
  {
    id: "Q18",
    query: "What will I actually learn if I take the ML elective?",
    relevantPostIds: [5, 21]
  },
  {
    id: "Q19",
    query: "Is Cloud Computing practical? Will I actually work with AWS?",
    relevantPostIds: [5, 22]
  },
  {
    id: "Q20",
    query: "How can I find an internship in second or third year?",
    relevantPostIds: [10, 11, 23, 24, 30]
  },
  {
    id: "Q21",
    query: "How should I cold message people for internship opportunities?",
    relevantPostIds: [10, 11, 23, 24]
  },
  {
    id: "Q22",
    query: "How should I ask a senior or alumnus for a referral without getting ignored?",
    relevantPostIds: [10, 11, 23, 24]
  },
  {
    id: "Q23",
    query: "How can I improve my profile and resume before applying for internships?",
    relevantPostIds: [10, 11, 17, 23, 24, 30]
  },
  {
    id: "Q24",
    query: "Where can I study quietly on campus when the library is crowded?",
    relevantPostIds: [8, 25]
  },
  {
    id: "Q25",
    query: "What's the SPIT campus atmosphere like and where can I sit peacefully?",
    relevantPostIds: [1, 7, 8, 25]
  },
  {
    id: "Q26",
    query: "Where can I get food around campus during a lecture break?",
    relevantPostIds: [7, 26]
  },
  {
    id: "Q27",
    query: "What extracurricular or technical activities can I get involved in on campus?",
    relevantPostIds: [27]
  },
  {
    id: "Q28",
    query: "What should I prepare for a software/technology interview at a bank?",
    relevantPostIds: [4, 9, 14, 16, 17, 19, 20, 28]
  },
  {
    id: "Q29",
    query: "What is the hostel fee at SPIT?",
    relevantPostIds: []
  },
  {
    id: "Q30",
    query: "What was SPIT's highest placement package last year?",
    relevantPostIds: []
  }
];

module.exports = {
  EVALUATION_QUERIES
};

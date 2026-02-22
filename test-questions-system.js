// Test script for Community Hub Question System
// Run this with: node test-questions-system.js

const API_BASE = 'http://localhost:3000/community';

async function testDuplicateDetection() {
    console.log('🧪 Testing AI Duplicate Question Detection\n');

    const testQuestion = {
        title: 'How to apply for education loan?',
        excerpt: 'Steps, documents and timeline for an education loan — short summary.',
        content: 'I am a student planning to study abroad and need guidance on the education loan application process. What documents are required and how long does it take?',
        category: 'loan'
    };

    console.log('📝 Checking for duplicates of:', testQuestion.title);
    console.log('Category:', testQuestion.category);
    console.log('');

    try {
        const response = await fetch(`${API_BASE}/forum/check-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testQuestion)
        });

        const result = await response.json();

        if (!result.success) {
            console.log('❌ API call failed');
            return;
        }

        console.log('✅ API Response:', result.message);
        console.log('');

        if (result.isDuplicate) {
            console.log('⚠️  Similar questions found:');
            result.similarQuestions.forEach((q, i) => {
                console.log(`\n${i + 1}. ${q.title}`);
                console.log(`   Similarity: ${(q.similarity * 100).toFixed(1)}%`);
                console.log(`   Reason: ${q.reason}`);
                console.log(`   URL: ${q.url}`);
            });
        } else {
            console.log('✅ No duplicates found - question is unique!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('fetch')) {
            console.log('\n💡 Make sure your server is running on http://localhost:3000');
        }
    }
}

async function testQuestionRetrieval() {
    console.log('\n\n🧪 Testing Question Retrieval\n');

    try {
        const response = await fetch(`${API_BASE}/explore/hub/loan`);
        const result = await response.json();

        if (result.success && result.data.forumPosts) {
            console.log(`✅ Found ${result.data.forumPosts.length} questions in loan hub`);

            if (result.data.forumPosts.length > 0) {
                const firstPost = result.data.forumPosts[0];
                console.log('\n📄 Sample question:');
                console.log(`   Title: ${firstPost.title || 'No title'}`);
                console.log(`   Author: ${firstPost.author?.firstName || 'Unknown'}`);
                console.log(`   Likes: ${firstPost.likes || 0}`);
                console.log(`   Answers: ${firstPost.commentCount || 0}`);
                console.log(`   URL: /question-discussion.html?id=${firstPost.id}&topic=loan`);
            }
        } else {
            console.log('⚠️  No questions found in loan hub');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function runTests() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  Community Hub Question System - Test Suite');
    console.log('═══════════════════════════════════════════════════\n');

    await testQuestionRetrieval();
    await testDuplicateDetection();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Tests Complete!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('💡 Next steps:');
    console.log('   1. Visit: http://localhost:3000/engage.html?topic=loan');
    console.log('   2. Click on any question to view discussion');
    console.log('   3. Post an answer (requires login)');
    console.log('   4. Test the AI duplicate detection');
}

// Run if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testDuplicateDetection, testQuestionRetrieval };

# Community Hub Question System - Implementation Plan

## Overview
This document outlines the implementation of:
1. AI-powered duplicate question detection
2. Dedicated question discussion pages  
3. Hub-specific question posting and navigation

## 1. Database Schema (Already Complete)
The `ForumPost` model in `schema.prisma` already supports questions with:
- `title`: Question title
- `content`: Question details
- `category`: Hub category (loan, visa, universities, etc.)
- `tags`: Related tags
- Comments system for answers

## 2. Backend API Endpoints

### A. Check for Duplicate Questions
**Endpoint**: `POST /community/forum/check-duplicate`
**Purpose**: Use AI to check if a similar question already exists before posting
**Request Body**:
```json
{
  "title": "How to apply for education loan?",
  "content": "I want to know the process...",
  "category": "loan"
}
````

**Response**:
```json
{
  "success": true,
  "isDuplicate": true,
  "similarQuestions": [
    {
      "id": "post_123",
      "title": "Education loan application process",
      "similarity": 0.85,
      "url": "/question-discussion.html?id=post_123&topic=loan"
    }
  ],
  "message": "We found similar questions. Would you like to view them?"
}
```

### B. Create Question with AI Check  
**Endpoint**: `POST /community/explore/hub/:topic/forum`
**Purpose**: Create a new question in a specific hub
**Implementation**: Already exists, needs enhancement to call duplicate check

## 3. AI Duplicate Detection Logic

The AI service will:
1. Fetch recent questions from the same category (last 100-200)
2. Use Groq LLM to compare the new question with existing ones
3. Calculate semantic similarity
4. Return matching questions above threshold (e.g., 0.7)

**AI Prompt Template**:
```
You are an expert at detecting duplicate questions. Given a new question and a list of existing questions, determine if the new question is substantially similar to any existing ones.

New Question:
Title: {newTitle}
Content: {newContent}

Existing Questions:
{existingQuestions}

For each existing question, provide:
1. Whether it's a duplicate (similarity > 0.7)
2. Similarity score (0-1)
3. Brief reason

Respond in JSON format:
{
  "matches": [
    {
      "questionId": "...",
      "similarity": 0.85,
      "reason": "Both ask about..."
    }
  ]
}
```

## 4. Frontend Implementation

### A. Question Discussion Page (`question-discussion.html`)
- ✅ Created with answer input, answers list, and related questions
- ✅ JavaScript (`question-discussion.js`) handles loading and interaction

### B. Hub Page Updates (`engage.html` + `community-forum.js`)
- ✅ Post cards now clickable - navigate to discussion page
- ✅ "Comments" changed to "Answers"
- ✅ Share URLs updated to point to question-discussion.html

### C. Duplicate Detection UI Flow
**To Implement**:
1. When user starts typing a question, show "checking for similar questions..." after 2-second delay
2. Make API call to `/community/forum/check-duplicate`
3. If duplicates found, show warning modal:
   ```
   "A similar question already exists! Would you like to:
   - View existing discussions
   - Post your question anyway"
   ```
4. Navigate to similar question if user chooses to view

## 5. Next Steps for Full Implementation

### Backend (community.service.ts):
```typescript
// Add to constructor
constructor(
    private prisma: PrismaService,
    private groqService: GroqService  // Add this
) { }

// Add new method
async checkDuplicateQuestion(questionData: {
    title: string;
    content: string;
    category: string;
}) {
    // 1. Fetch recent questions from same category
    const existingQuestions = await this.prisma.forumPost.findMany({
        where: { category: questionData.category },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, title: true, content: true }
    });

    if (existingQuestions.length === 0) {
        return { isDuplicate: false, similarQuestions: [] };
    }

    // 2. Prepare AI prompt
    const prompt = `You are detecting duplicate questions...
    New: "${questionData.title}" - ${questionData.content}
    
    Existing questions:
    ${existingQuestions.map((q, i) => `${i+1}. ID:${q.id} "${q.title}"`).join('\\n')}
    
    Return JSON: {"matches": [{"id": "...", "similarity": 0-1, "title": "..."}]}
    Only include matches with similarity > 0.7`;

    // 3. Call AI
    const aiResponse = await this.groqService.getJson<{
        matches: Array<{id: string; similarity: number; title: string}>
    }>(prompt);

    // 4. Return results
    return {
        isDuplicate: aiResponse.matches.length > 0,
        similarQuestions: aiResponse.matches.map(m => ({
            ...m,
            url: `/question-discussion.html?id=${m.id}&topic=${questionData.category}`
        }))
    };
}
````

### Backend (community.controller.ts):
```typescript
@Post('forum/check-duplicate')
async checkDuplicate(@Body() body: { title: string; content: string; category: string }) {
    const result = await this.communityService.checkDuplicateQuestion(body);
    return { success: true, ...result };
}
```

### Frontend (community-forum.js):
```javascript
let duplicateCheckTimeout;
const postContent = document.getElementById('postContent');

postContent.addEventListener('input', () => {
    clearTimeout(duplicateCheckTimeout);
    duplicateCheckTimeout = setTimeout(async () => {
        const content = postContent.value.trim();
        if (content.length > 20) {
            await checkForDuplicates(content);
        }
    }, 2000);
});

async function checkForDuplicates(content) {
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic') || 'general';
    const title = content.substring(0, 100);
    
    const response = await fetch(`${API_BASE_URL}/forum/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category: topic })
    });
    
    const result = await response.json();
    if (result.isDuplicate) {
        showDuplicateWarning(result.similarQuestions);
    }
}

function showDuplicateWarning(similarQuestions) {
    // Show modal with similar questions
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md">
                <h3 class="text-xl font-bold mb-4">Similar Questions Found!</h3>
                <p class="mb-4">We found questions that might answer your query:</p>
                <div class="space-y-2 mb-6">
                    ${similarQuestions.map(q => `
                        <a href="${q.url}" class="block p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-brand-100">
                            <div class="font-bold">${q.title}</div>
                            <div class="text-sm text-gray-500">Similarity: ${(q.similarity * 100).toFixed(0)}%</div>
                        </a>
                    `).join('')}
                </div>
                <div class="flex gap-2">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 px-4 py-2 bg-gray-300 rounded-lg">
                        Post Anyway
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
```

## Implementation Status

### ✅ Completed:
1. Question discussion page (HTML + JS)
2. Click navigation from hub to discussion
3. Share URLs updated
4. UI label changes (Comments → Answers)
5. Module imports (AiModule in CommunityModule)

### 🔄 To Complete:
1. Add GroqService injection to CommunityService
2. Implement `checkDuplicateQuestion` method
3. Add `/forum/check-duplicate` endpoint
4. Add frontend duplicate detection UI and flow
5. Test end-to-end functionality

## Testing Plan

1. **Manual Testing**:
   - Post a question "How to apply for education loan?"
   - Try to post similar question "What is the process for education loan application?"
   - Verify AI detects similarity
   - Verify warning shows with link to original
   - Verify clicking navigates correctly

2. **Edge Cases**:
   - No similar questions exist
   - AI service fails/unavailable
   - Very short questions
   - Multiple highly similar matches

## Notes

- AI duplicate detection is a suggestion, not a block - users can still post
- Similarity threshold of 0.7 is configurable
- Only searches within same hub/category for relevance
- Consider caching recent questions to reduce DB load

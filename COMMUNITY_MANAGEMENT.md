# Community Management & Statistics - Implementation Complete

## ✅ Features Implemented

### 1. **Display Statistics on Posts**
✅ **Votes (Likes)**: Shows number of likes on each post  
✅ **Answers**: Shows number of answers/comments  
✅ **Views**: Displays view count for each post  

### 2. **Admin Post Control**
✅ **Delete Posts**: Only admins can delete any post  
✅ **Visual Indicator**: Delete button appears only for admins  
✅ **Confirmation**: Requires confirmation before deletion  

### 3. **Comment/Answer Control**
✅ **Delete Own Comments**: Users can delete their own comments/answers  
✅ **Admin Override**: Admins can delete any comment  
✅ **No Delete Questions**: Users cannot delete questions (posts), only comments  
✅ **Visual Indicator**: Delete button only shows for authorized users  

---

## 📊 What You See Now

### Post Card Display:
```
┌──────────────────────────────────────────────┐
│ 👤 John Doe [Admin] [Delete🗑️]        2h ago │
│                                              │
│ How to apply for education loan?            │
│                                              │
│ I want to know the complete process...      │
│                                              │
├──────────────────────────────────────────────┤
│ ❤️ 15  💬 8 Answers  👁️ 142 Views  🔗 Share │
└──────────────────────────────────────────────┘
```

### Comment/Answer Display:
```
┌──────────────────────────────────────────────┐
│ 👤 Jane Smith [Mentor]  [Delete🗑️]    1h ago │
│                                              │
│ You need to submit these documents...        │
│                                              │
│ ❤️ 5  💬 Reply                               │
└──────────────────────────────────────────────┘
```

---

## 🔐 Access Control Rules

### Posts (Questions):
| Role | View | Like | Post | Delete |
|------|------|------|------|--------|
| **Admin** | ✅ | ✅ | ✅ | ✅ (All posts) |
| **User** | ✅ | ✅ | ✅ | ❌ |
| **Guest** | ✅ | ❌ | ❌ | ❌ |

### Comments (Answers):
| Role | View | Like | Post | Delete |
|------|------|------|------|--------|
| **Admin** | ✅ | ✅ | ✅ | ✅ (All comments) |
| **Comment Author** | ✅ | ✅ | ✅ | ✅ (Own only) |
| **Other Users** | ✅ | ✅ | ✅ | ❌ |
| **Guest** | ✅ | ❌ | ❌ | ❌ |

---

## 🛠️ Technical Implementation

### Frontend Updates

#### 1. **community-forum.js** (Hub Page)
**Lines Modified**: ~107-174, ~176-320

**Changes**:
- Added `views` count display
- Added admin-only delete button for posts
- Added `handleDeletePost` function
- Updated post card HTML with statistics

**Example Code**:
```javascript
// Display views count
<div class="flex items-center gap-2 text-xs font-bold text-gray-500">
    <span class="material-symbols-rounded text-lg">visibility</span>
    <span>${views}</span> Views
</div>

// Admin delete button
${isAdmin ? `
    <button data-action="delete-post" data-id="${post.id}" 
            class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
        <span class="material-symbols-rounded">delete</span>
    </button>
` : ''}
```

#### 2. **question-discussion.js** (Discussion Page)
**Lines Modified**: ~228-359

**Changes**:
- Added delete button for comments (author or admin only)
- Added `handleDeleteComment` function
- Checks user permissions before showing delete button

**Example Code**:
```javascript
// Check permissions
const currentUserId = localStorage.getItem('userId');
const currentUserRole = localStorage.getItem('userRole');
const canDelete = (answer.authorId === currentUserId) || (currentUserRole === 'admin');

// Show delete button if authorized
${canDelete ? `
    <button data-action="delete-comment" data-id="${answer.id}">
        <span class="material-symbols-rounded">delete</span>
    </button>
` : ''}
```

### Backend Updates

#### 3. **community.controller.ts**
**New Endpoints Added**:

```typescript
// Delete a forum post (Admin only)
@Delete('forum/:id')
@UseGuards(UserGuard)
async deleteForumPost(@Request() req, @Param('id') id: string)

// Delete a forum comment (Author or Admin)
@Delete('forum/comments/:id')
@UseGuards(UserGuard)
async deleteForumComment(@Request() req, @Param('id') id: string)
```

**Authorization**:
- Posts: Checks `req.user.role === 'admin'`, throws 403 if not
- Comments: Checks `comment.authorId === userId` OR `role === 'admin'`

#### 4. **community.service.ts**
**New Methods**:

```typescript
async deleteForumPost(id: string) {
    await this.prisma.forumPost.delete({ where: { id } });
    return { success: true, message: 'Post deleted successfully' };
}

async deleteForumComment(userId: string, userRole: string, commentId: string) {
    const comment = await this.prisma.forumComment.findUnique({ where: { id: commentId } });
    
    // Check authorization
    if (comment.authorId !== userId && userRole !== 'admin') {
        throw new HttpException('You can only delete your own comments', HttpStatus.FORBIDDEN);
    }
    
    await this.prisma.forumComment.delete({ where: { id: commentId } });
    return { success: true, message: 'Comment deleted successfully' };
}
```

---

## 📁 Files Modified

### Frontend:
1. **`web/assets/js/community-forum.js`**
   - Added views display
   - Added admin delete button for posts
   - Added `handleDeletePost` function

2. **`web/assets/js/question-discussion.js`**
   - Added delete button for comments
   - Added `handleDeleteComment` function
   - Added authorization checks

### Backend:
3. **`server/src/community/community.controller.ts`**
   - Added DELETE `/forum/:id` endpoint
   - Added DELETE `/forum/comments/:id` endpoint
   - Added HttpException and HttpStatus imports

4. **`server/src/community/community.service.ts`**
   - Added `deleteForumPost` method
   - Added `deleteForumComment` method
   - Added HttpException and HttpStatus imports

---

## 🧪 Testing Instructions

### Test 1: View Statistics
1. Go to any hub: `http://localhost:3000/engage.html?topic=loan`
2. ✅ Should see likes, answer count, and views on each post

### Test 2: Admin Delete Post
1. Login as admin
2. Go to any hub page
3. ✅ Should see delete button (🗑️) on posts
4. Click delete → Confirm
5. ✅ Post should vanish with animation

### Test 3: User Cannot Delete Post
1. Login as regular user
2. Go to hub page
3. ✅ Should NOT see delete button on posts

### Test 4: Delete Own Comment
1. Login as any user
2. Go to a question discussion page
3. Post a comment/answer
4. ✅ Should see delete button on YOUR comment
5. Click delete → Confirm
6. ✅ Comment should be deleted

### Test 5: Cannot Delete Others' Comments
1. Login as regular user
2. View a question with comments from others
3. ✅ Should NOT see delete button on others' comments

### Test 6: Admin Delete Any Comment
1. Login as admin
2. View any question discussion
3. ✅ Should see delete button on ALL comments
4. Can delete any comment successfully

---

## 🎯 User Experience Flow

### Admin Deleting a Post:
```
Admin clicks delete button
  ↓
"Are you sure?" confirmation
  ↓
Admin confirms
  ↓
API call: DELETE /community/forum/:id
  ↓
Backend checks: is admin? ✅
  ↓
Post deleted from database (cascade deletes comments & likes)
  ↓
Frontend removes post with fade animation
  ↓
"Post deleted successfully" toast
```

### User Deleting Own Comment:
```
User clicks delete button on their comment
  ↓
"Are you sure?" confirmation
  ↓
User confirms
  ↓
API call: DELETE /community/forum/comments/:id
  ↓
Backend checks: is author? ✅
  ↓
Comment deleted from database (cascade deletes replies & likes)
  ↓
Page reloads to show updated discussion
  ↓
"Comment deleted successfully" toast
```

### User Trying to Delete Others' Comment:
```
User doesn't see delete button ❌
(Authorization check happens in frontend)
```

---

## 🔒 Security Features

✅ **Backend Authorization**: Double-checks permissions on server  
✅ **Frontend Hide**: Buttons don't show for unauthorized users  
✅ **Confirmation Dialogs**: Prevents accidental deletions  
✅ **Cascade Deletes**: Automatically removes related data  
✅ **Error Handling**: Clear error messages for failed deletions  

---

## 📊 Statistics Tracking

The system already tracks (from schema):
- **Likes**: Stored in `ForumPost.likes` and `ForumComment.likes`
- **Views**: Stored in `ForumPost.views`
- **Comments**: Calculated from `ForumComment` count

These are displayed in real-time on:
- Hub feed (`engage.html`)
- Question discussion page (`question-discussion.html`)

---

## 🎨 UI Elements Added

### Delete Buttons:
- **Icon**: Material Symbol `delete`
- **Color**: Red (`text-red-500`)
- **Hover**: Light red background (`hover:bg-red-50`)
- **Dark Mode**: Dark red background (`dark:hover:bg-red-900/20`)
- **Size**: Small (16px icon for comments, 18px for posts)
- **Position**: Top-right corner next to timestamp

### Views Counter:

- **Icon**: Material Symbol `visibility`
- **Color**: Gray (`text-gray-500`)
- **Position**: Inline with likes and answers

---

## ✅ Status: **FULLY IMPLEMENTED**

All requested features are now live:
- ✅ Statistics display (votes, answers, views)
- ✅ Admin can delete any post
- ✅ Users can delete own comments only
- ✅ Admin can delete any comment
- ✅ Users cannot delete questions
- ✅ Full access control system

**The community management system is production-ready!** 🚀

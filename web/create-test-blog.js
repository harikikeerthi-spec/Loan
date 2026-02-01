// Quick script to create a test blog
const testBlog = {
    title: "Welcome to LoanHero Blog",
    slug: "welcome-to-loanhero-blog",
    excerpt: "This is your first blog post! Learn how to manage your education loans effectively.",
    content: "Welcome to the LoanHero blog! This is where we share valuable insights about education loans, financial planning, and student success stories.\n\nOur mission is to make education financing transparent and accessible to everyone. Stay tuned for more articles!",
    category: "education",
    authorName: "LoanHero Team",
    featuredImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    readTime: 3,
    isFeatured: true,
    isPublished: true,
    tags: ["education", "loans", "welcome"]
};

fetch('http://localhost:3000/blogs', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testBlog)
})
    .then(res => res.json())
    .then(data => console.log('Blog created:', data))
    .catch(err => console.error('Error:', err));

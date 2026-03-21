
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async getRecentActivity(limit = 20) {
        // Fetch recent activities from multiple sources
        const [
            applications,
            blogs,
            forumPosts,
            users,
            mentors,
        ] = await Promise.all([
            // Recent Applications
            this.prisma.loanApplication.findMany({
                take: limit,
                orderBy: { date: 'desc' }, // Used date as per schema
                select: {
                    id: true,
                    applicationNumber: true,
                    status: true,
                    date: true,
                    user: {
                        select: { firstName: true, lastName: true },
                    },
                }
            }),
            // Recent Blogs
            this.prisma.blog.findMany({
                take: limit,
                orderBy: { publishedAt: 'desc' },
                where: { isPublished: true },
                select: {
                    id: true,
                    title: true,
                    authorName: true,
                    publishedAt: true,
                    createdAt: true
                }
            }),
            // Recent Forum Posts
            this.prisma.forumPost.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { firstName: true, lastName: true } }
                }
            }),
            // New Users
            this.prisma.user.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    createdAt: true
                }
            }),
            // New Mentors
            this.prisma.mentor.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    expertise: true,
                    createdAt: true
                }
            })
        ]);

        const formatName = (f: string | null, l: string | null) => {
            return `${f || ''} ${l || ''}`.trim() || 'Unknown User';
        };

        // Normalize data
        const activities = [
            ...applications.map(app => ({
                id: app.id,
                type: 'application',
                title: `Application #${app.applicationNumber}`,
                description: `${formatName(app.user?.firstName, app.user?.lastName)} - ${app.status}`,
                status: app.status,
                date: app.date,
                link: '#', // TODO: Link to application details
            })),
            ...blogs.map(blog => ({
                id: blog.id,
                type: 'blog',
                title: `Blog Published: ${blog.title}`,
                description: `By ${blog.authorName}`,
                status: 'published',
                date: blog.publishedAt || blog.createdAt,
                link: `/blog/${blog.id}`,
            })),
            ...forumPosts.map(post => ({
                id: post.id,
                type: 'forum',
                title: `Forum Post: ${post.title}`,
                description: `By ${formatName(post.author.firstName, post.author.lastName)}`,
                status: 'discussion',
                date: post.createdAt,
                link: `/community/forum/${post.id}`, // Placeholder
            })),
            ...users.map(user => ({
                id: user.id,
                type: 'user',
                title: `New User Joined`,
                description: `${formatName(user.firstName, user.lastName)} (${user.email})`,
                status: 'active',
                date: user.createdAt,
                link: `/user/${user.id}`,
            })),
            ...mentors.map(mentor => ({
                id: mentor.id,
                type: 'mentor',
                title: `New Mentor Profile`,
                description: `${mentor.name} - ${mentor.expertise.join(', ')}`,
                status: 'pending',
                date: mentor.createdAt,
                link: `/mentor/${mentor.id}`,
            }))
        ];

        // Sort by date descending
        return activities
            .sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, limit);
    }
}

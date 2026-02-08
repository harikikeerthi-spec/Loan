import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
    constructor(private prisma: PrismaService) { }

    // ==================== MENTORSHIP METHODS ====================

    async getAllMentors(filters: any) {
        const { university, country, loanType, category, limit, offset } = filters;

        const where: any = { isActive: true, isApproved: true };

        if (university) {
            where.university = { contains: university, mode: 'insensitive' };
        }
        if (country) {
            where.country = { contains: country, mode: 'insensitive' };
        }
        if (loanType) {
            where.loanType = { contains: loanType, mode: 'insensitive' };
        }
        if (category) {
            where.category = { contains: category, mode: 'insensitive' };
        }

        const [mentors, total] = await Promise.all([
            this.prisma.mentor.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: [{ rating: 'desc' }, { studentsMentored: 'desc' }],
            }),
            this.prisma.mentor.count({ where }),
        ]);

        return {
            success: true,
            data: mentors,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + mentors.length < total,
            },
        };
    }

    async getFeaturedMentors(limit: number) {
        const mentors = await this.prisma.mentor.findMany({
            where: {
                isActive: true,
                isApproved: true,
                rating: { gte: 4.5 },
            },
            take: limit,
            orderBy: [{ rating: 'desc' }, { studentsMentored: 'desc' }],
        });

        return {
            success: true,
            data: mentors,
        };
    }

    async getMentorById(id: string) {
        const mentor = await this.prisma.mentor.findUnique({
            where: { id },
        });

        if (!mentor) {
            throw new NotFoundException('Mentor not found');
        }

        return {
            success: true,
            data: mentor,
        };
    }

    async bookMentorSession(mentorId: string, bookingData: any) {
        const mentor = await this.prisma.mentor.findUnique({
            where: { id: mentorId },
        });

        if (!mentor) {
            throw new NotFoundException('Mentor not found');
        }

        if (!mentor.isActive) {
            throw new BadRequestException('Mentor is not currently accepting bookings');
        }

        const booking = await this.prisma.mentorBooking.create({
            data: {
                mentorId,
                ...bookingData,
                status: 'pending',
            },
        });

        return {
            success: true,
            message: 'Booking request submitted successfully',
            data: booking,
        };
    }

    async applyAsMentor(applicationData: any) {
        // Validate required fields
        if (!applicationData || !applicationData.email) {
            throw new BadRequestException('Email is required');
        }
        if (!applicationData.name) {
            throw new BadRequestException('Name is required');
        }
        if (!applicationData.university) {
            throw new BadRequestException('University is required');
        }
        if (!applicationData.country) {
            throw new BadRequestException('Country is required');
        }

        // Check if email already exists
        const existingMentor = await this.prisma.mentor.findUnique({
            where: { email: applicationData.email },
        });

        if (existingMentor) {
            throw new BadRequestException('A mentor with this email already exists');
        }

        const mentor = await this.prisma.mentor.create({
            data: {
                name: applicationData.name,
                email: applicationData.email,
                phone: applicationData.phone || null,
                university: applicationData.university,
                degree: applicationData.degree || '',
                country: applicationData.country,
                loanBank: applicationData.loanBank || '',
                loanAmount: applicationData.loanAmount || '',
                interestRate: applicationData.interestRate || null,
                loanType: applicationData.loanType || null,
                category: applicationData.category || null,
                bio: applicationData.bio || '',
                expertise: applicationData.expertise || [],
                linkedIn: applicationData.linkedIn || null,
                image: applicationData.image || null,
                isActive: false,
                isApproved: false,
                rating: 0,
                studentsMentored: 0,
            },
        });

        return {
            success: true,
            message: 'Mentor application submitted successfully. We will review and get back to you soon.',
            data: mentor,
        };
    }

    async getMentorStats() {
        const [total, active, averageRating] = await Promise.all([
            this.prisma.mentor.count({ where: { isApproved: true } }),
            this.prisma.mentor.count({ where: { isActive: true, isApproved: true } }),
            this.prisma.mentor.aggregate({
                where: { isApproved: true },
                _avg: { rating: true },
            }),
        ]);

        const totalMentored = await this.prisma.mentor.aggregate({
            where: { isApproved: true },
            _sum: { studentsMentored: true },
        });

        return {
            success: true,
            data: {
                totalMentors: total,
                activeMentors: active,
                averageRating: averageRating._avg.rating || 0,
                totalStudentsMentored: totalMentored._sum.studentsMentored || 0,
            },
        };
    }

    // ==================== EVENTS METHODS ====================

    async getAllEvents(filters: any) {
        const { type, category, featured, limit, offset } = filters;

        const where: any = {};

        if (type) {
            where.type = type;
        }
        if (category) {
            where.category = category;
        }
        if (featured !== undefined) {
            where.isFeatured = featured;
        }

        const [events, total] = await Promise.all([
            this.prisma.communityEvent.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { date: 'asc' },
            }),
            this.prisma.communityEvent.count({ where }),
        ]);

        return {
            success: true,
            data: events,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + events.length < total,
            },
        };
    }

    async getUpcomingEvents(limit: number) {
        const now = new Date();

        const events = await this.prisma.communityEvent.findMany({
            where: {
                date: { gte: now.toISOString() },
            },
            take: limit,
            orderBy: { date: 'asc' },
        });

        return {
            success: true,
            data: events,
        };
    }

    async getPastEvents(limit: number, offset: number) {
        const now = new Date();

        const [events, total] = await Promise.all([
            this.prisma.communityEvent.findMany({
                where: {
                    date: { lt: now.toISOString() },
                },
                take: limit,
                skip: offset,
                orderBy: { date: 'desc' },
            }),
            this.prisma.communityEvent.count({
                where: { date: { lt: now.toISOString() } },
            }),
        ]);

        return {
            success: true,
            data: events,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + events.length < total,
            },
        };
    }

    async getEventById(id: string) {
        const event = await this.prisma.communityEvent.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { registrations: true },
                },
            },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        return {
            success: true,
            data: {
                ...event,
                registeredCount: event._count.registrations,
            },
        };
    }

    async registerForEvent(eventId: string, registrationData: any) {
        const event = await this.prisma.communityEvent.findUnique({
            where: { id: eventId },
            include: {
                _count: {
                    select: { registrations: true },
                },
            },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        // Check if event is in the past
        if (new Date(event.date) < new Date()) {
            throw new BadRequestException('Cannot register for past events');
        }

        // Check if event is full
        if (event.maxAttendees && event._count.registrations >= event.maxAttendees) {
            throw new BadRequestException('Event is full');
        }

        // Check if already registered
        const existingRegistration = await this.prisma.eventRegistration.findFirst({
            where: {
                eventId,
                email: registrationData.email,
            },
        });

        if (existingRegistration) {
            throw new BadRequestException('You are already registered for this event');
        }

        const registration = await this.prisma.eventRegistration.create({
            data: {
                eventId,
                ...registrationData,
            },
        });

        // Update attendees count
        await this.prisma.communityEvent.update({
            where: { id: eventId },
            data: {
                attendeesCount: { increment: 1 },
            },
        });

        return {
            success: true,
            message: 'Successfully registered for the event',
            data: registration,
        };
    }

    // ==================== SUCCESS STORIES METHODS ====================

    async getAllStories(filters: any) {
        const { country, category, limit, offset } = filters;

        const where: any = { isApproved: true };

        if (country) {
            where.country = { contains: country, mode: 'insensitive' };
        }
        if (category) {
            where.category = { contains: category, mode: 'insensitive' };
        }

        const [stories, total] = await Promise.all([
            this.prisma.successStory.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.successStory.count({ where }),
        ]);

        return {
            success: true,
            data: stories,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + stories.length < total,
            },
        };
    }

    async getFeaturedStories(limit: number) {
        const stories = await this.prisma.successStory.findMany({
            where: {
                isApproved: true,
                isFeatured: true,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            data: stories,
        };
    }

    async getStoryById(id: string) {
        const story = await this.prisma.successStory.findUnique({
            where: { id },
        });

        if (!story) {
            throw new NotFoundException('Story not found');
        }

        return {
            success: true,
            data: story,
        };
    }

    async submitStory(storyData: any) {
        const story = await this.prisma.successStory.create({
            data: {
                ...storyData,
                isApproved: false,
                isFeatured: false,
            },
        });

        return {
            success: true,
            message: 'Success story submitted successfully. We will review and publish it soon.',
            data: story,
        };
    }

    // ==================== RESOURCES METHODS ====================

    async getAllResources(filters: any) {
        const { type, category, limit, offset } = filters;

        const where: any = {};

        if (type) {
            where.type = type;
        }
        if (category) {
            where.category = { contains: category, mode: 'insensitive' };
        }

        const [resources, total] = await Promise.all([
            this.prisma.communityResource.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.communityResource.count({ where }),
        ]);

        return {
            success: true,
            data: resources,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + resources.length < total,
            },
        };
    }

    async getPopularResources(limit: number) {
        const resources = await this.prisma.communityResource.findMany({
            take: limit,
            orderBy: { downloads: 'desc' },
        });

        return {
            success: true,
            data: resources,
        };
    }

    async getResourceById(id: string) {
        const resource = await this.prisma.communityResource.findUnique({
            where: { id },
        });

        if (!resource) {
            throw new NotFoundException('Resource not found');
        }

        return {
            success: true,
            data: resource,
        };
    }

    async trackResourceView(resourceId: string) {
        const resource = await this.prisma.communityResource.update({
            where: { id: resourceId },
            data: {
                downloads: { increment: 1 },
            },
        });

        return {
            success: true,
            data: { downloads: resource.downloads },
        };
    }

    // ==================== ADMIN METHODS ====================

    async createMentor(mentorData: any) {
        const mentor = await this.prisma.mentor.create({
            data: {
                ...mentorData,
                expertise: mentorData.expertise || [],
                isActive: mentorData.isActive !== undefined ? mentorData.isActive : true,
                isApproved: true,
                rating: mentorData.rating || 0,
                studentsMentored: mentorData.studentsMentored || 0,
            },
        });

        return {
            success: true,
            message: 'Mentor created successfully',
            data: mentor,
        };
    }

    async updateMentor(id: string, updateData: any) {
        const mentor = await this.prisma.mentor.update({
            where: { id },
            data: updateData,
        });

        return {
            success: true,
            message: 'Mentor updated successfully',
            data: mentor,
        };
    }

    async deleteMentor(id: string) {
        await this.prisma.mentor.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Mentor deleted successfully',
        };
    }

    async createEvent(eventData: any) {
        const event = await this.prisma.communityEvent.create({
            data: {
                ...eventData,
                attendeesCount: 0,
                isFeatured: eventData.isFeatured || false,
            },
        });

        return {
            success: true,
            message: 'Event created successfully',
            data: event,
        };
    }

    async updateEvent(id: string, updateData: any) {
        const event = await this.prisma.communityEvent.update({
            where: { id },
            data: updateData,
        });

        return {
            success: true,
            message: 'Event updated successfully',
            data: event,
        };
    }

    async deleteEvent(id: string) {
        await this.prisma.communityEvent.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Event deleted successfully',
        };
    }

    async createResource(resourceData: any) {
        const resource = await this.prisma.communityResource.create({
            data: {
                ...resourceData,
                downloads: 0,
                isFeatured: resourceData.isFeatured || false,
            },
        });

        return {
            success: true,
            message: 'Resource created successfully',
            data: resource,
        };
    }

    async updateResource(id: string, updateData: any) {
        const resource = await this.prisma.communityResource.update({
            where: { id },
            data: updateData,
        });

        return {
            success: true,
            message: 'Resource updated successfully',
            data: resource,
        };
    }

    async deleteResource(id: string) {
        await this.prisma.communityResource.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Resource deleted successfully',
        };
    }

    async approveMentor(id: string, approved: boolean, reason?: string) {
        const mentor = await this.prisma.mentor.update({
            where: { id },
            data: {
                isApproved: approved,
                isActive: approved,
                rejectionReason: approved ? null : reason,
            },
        });

        return {
            success: true,
            message: approved ? 'Mentor approved' : 'Mentor rejected',
            data: mentor,
        };
    }

    async approveStory(id: string, approved: boolean, reason?: string) {
        const story = await this.prisma.successStory.update({
            where: { id },
            data: {
                isApproved: approved,
                rejectionReason: approved ? null : reason,
            },
        });

        return {
            success: true,
            message: approved ? 'Story approved' : 'Story rejected',
            data: story,
        };
    }

    async getAllBookings(filters: any) {
        const { status, mentorId, limit, offset } = filters;

        const where: any = {};

        if (status) {
            where.status = status;
        }
        if (mentorId) {
            where.mentorId = mentorId;
        }

        const [bookings, total] = await Promise.all([
            this.prisma.mentorBooking.findMany({
                where,
                take: limit,
                skip: offset,
                include: {
                    mentor: {
                        select: {
                            name: true,
                            email: true,
                            university: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.mentorBooking.count({ where }),
        ]);

        return {
            success: true,
            data: bookings,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + bookings.length < total,
            },
        };
    }

    async getAllRegistrations(filters: any) {
        const { eventId, limit, offset } = filters;

        const where: any = {};

        if (eventId) {
            where.eventId = eventId;
        }

        const [registrations, total] = await Promise.all([
            this.prisma.eventRegistration.findMany({
                where,
                take: limit,
                skip: offset,
                include: {
                    event: {
                        select: {
                            title: true,
                            date: true,
                            type: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.eventRegistration.count({ where }),
        ]);

        return {
            success: true,
            data: registrations,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + registrations.length < total,
            },
        };
    }

    async getCommunityStats() {
        const [
            mentorCount,
            eventCount,
            storyCount,
            resourceCount,
            bookingCount,
            registrationCount,
        ] = await Promise.all([
            this.prisma.mentor.count({ where: { isApproved: true } }),
            this.prisma.communityEvent.count(),
            this.prisma.successStory.count({ where: { isApproved: true } }),
            this.prisma.communityResource.count(),
            this.prisma.mentorBooking.count(),
            this.prisma.eventRegistration.count(),
        ]);

        return {
            success: true,
            data: {
                mentors: mentorCount,
                events: eventCount,
                stories: storyCount,
                resources: resourceCount,
                bookings: bookingCount,
                registrations: registrationCount,
            },
        };
    }
    // ==================== FORUM/TOPIC METHODS ====================

    async getForumPosts(filters: any) {
        const { category, tag, limit, offset, sort } = filters;
        const where: any = {};

        if (category) {
            where.category = { contains: category, mode: 'insensitive' };
        }
        if (tag) {
            where.tags = { has: tag };
        }

        const orderBy: any = sort === 'popular' ? { likes: 'desc' } : { createdAt: 'desc' };

        const [posts, total] = await Promise.all([
            this.prisma.forumPost.findMany({
                where,
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                            role: true,
                        }
                    },
                    _count: {
                        select: { comments: true }
                    }
                },
                take: limit,
                skip: offset,
                orderBy,
            }),
            this.prisma.forumPost.count({ where }),
        ]);

        return {
            success: true,
            data: posts.map(post => ({
                ...post,
                commentCount: post._count.comments
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + posts.length < total,
            },
        };
    }

    async getForumPostById(id: string) {
        const post = await this.prisma.forumPost.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                        id: true,
                        role: true,
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                firstName: true,
                                lastName: true,
                                id: true,
                                role: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                _count: {
                    select: { comments: true }
                }
            }
        });

        if (!post) throw new NotFoundException('Post not found');

        // Increment views
        await this.prisma.forumPost.update({
            where: { id },
            data: { views: { increment: 1 } }
        });

        return {
            success: true,
            data: post
        };
    }

    async createForumPost(userId: string, data: any) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const post = await this.prisma.forumPost.create({
            data: {
                title: data.title,
                content: data.content,
                category: data.category,
                tags: data.tags || [],
                authorId: userId,
                isMentorOnly: data.isMentorOnly || false
            }
        });

        return {
            success: true,
            message: 'Post created successfully',
            data: post
        };
    }

    async createForumComment(userId: string, postId: string, content: string) {
        const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        const comment = await this.prisma.forumComment.create({
            data: {
                content,
                postId,
                authorId: userId
            },
            include: {
                author: {
                    select: { firstName: true, lastName: true, role: true }
                }
            }
        });

        return {
            success: true,
            message: 'Comment added successfully',
            data: comment
        };
    }

    async likeForumPost(id: string) {
        try {
            const post = await this.prisma.forumPost.update({
                where: { id },
                data: { likes: { increment: 1 } }
            });
            return { success: true, likes: post.likes };
        } catch (error) {
            throw new NotFoundException('Post not found');
        }
    }
}

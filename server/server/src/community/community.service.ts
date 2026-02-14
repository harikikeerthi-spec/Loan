import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

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
      throw new BadRequestException(
        'Mentor is not currently accepting bookings',
      );
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
      message:
        'Mentor application submitted successfully. We will review and get back to you soon.',
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
    if (
      event.maxAttendees &&
      event._count.registrations >= event.maxAttendees
    ) {
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
      throw new BadRequestException(
        'You are already registered for this event',
      );
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
      message:
        'Success story submitted successfully. We will review and publish it soon.',
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
        isActive:
          mentorData.isActive !== undefined ? mentorData.isActive : true,
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

  async getForumPosts(filters: any, userId?: string) {
    const { category, tag, limit, offset, sort } = filters;
    const where: any = {};

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (tag) {
      where.tags = { has: tag };
    }

    const orderBy: any =
      sort === 'popular' ? { likes: 'desc' } : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        take: limit,
        skip: offset,
        orderBy,
      }),
      this.prisma.forumPost.count({ where }),
    ]);

    // If userId is provided, check for likes
    let likedPostIds = new Set<string>();
    if (userId && posts.length > 0) {
      try {
        // Use raw query as fallback
        const userLikes: any[] = await this.prisma.$queryRaw`
                    SELECT "postId" FROM "PostLike" 
                    WHERE "userId" = ${userId} 
                    AND "postId" IN (${Prisma.join(posts.map((p) => p.id))})
                `;
        likedPostIds = new Set(userLikes.map((l) => l.postId));
      } catch (e) {
        console.error('Failed to fetch likes via raw query:', e);
      }
    }

    return {
      success: true,
      data: posts.map((post) => ({
        ...post,
        commentCount: post._count.comments,
        liked: likedPostIds.has(post.id),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + posts.length < total,
      },
    };
  }

  async getForumPostById(id: string, userId?: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            id: true,
            role: true,
          },
        },
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                id: true,
                role: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    firstName: true,
                    lastName: true,
                    id: true,
                    role: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    // Increment views
    await this.prisma.forumPost.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    let liked = false;
    const likedCommentIds = new Set<string>();

    if (userId) {
      try {
        // Check if post is liked
        const postLikes: any[] = await this.prisma.$queryRaw`
                    SELECT * FROM "PostLike" WHERE "postId" = ${id} AND "userId" = ${userId} LIMIT 1
                `;
        liked = postLikes.length > 0;

        // Check for liked comments
        const allCommentIds: string[] = [];
        post.comments.forEach((c) => {
          allCommentIds.push(c.id);
          if (c.replies) c.replies.forEach((r) => allCommentIds.push(r.id));
        });

        if (allCommentIds.length > 0) {
          const commentLikes: any[] = await this.prisma.$queryRaw`
                        SELECT "commentId" FROM "ForumCommentLike" 
                        WHERE "userId" = ${userId} 
                        AND "commentId" IN (${Prisma.join(allCommentIds)})
                    `;
          commentLikes.forEach((l) => likedCommentIds.add(l.commentId));
        }
      } catch (e) {
        console.error('Failed to fetch likes via raw query:', e);
      }
    }

    // Map comments to include liked status
    const commentsWithLikes = post.comments.map((c) => ({
      ...c,
      liked: likedCommentIds.has(c.id),
      replies: c.replies.map((r) => ({
        ...r,
        liked: likedCommentIds.has(r.id),
      })),
    }));

    return {
      success: true,
      data: {
        ...post,
        comments: commentsWithLikes,
        liked,
      },
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
        isMentorOnly: data.isMentorOnly || false,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
            id: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Post created successfully',
      data: post,
    };
  }

  async createForumComment(
    userId: string,
    postId: string,
    content: string,
    parentId?: string,
  ) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.forumComment.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });

    return {
      success: true,
      message: 'Comment added successfully',
      data: comment,
    };
  }

  async likeForumComment(userId: string, id: string) {
    try {
      // Use raw query checks
      const existingLikes: any[] = await this.prisma.$queryRaw`
                SELECT id FROM "ForumCommentLike" 
                WHERE "commentId" = ${id} AND "userId" = ${userId}
                LIMIT 1
            `;
      const existingLike = existingLikes[0];

      if (existingLike) {
        // Un-like: remove the like record and decrement count
        await this.prisma.$transaction([
          this.prisma
            .$executeRaw`DELETE FROM "ForumCommentLike" WHERE id = ${existingLike.id}`,
          this.prisma.forumComment.update({
            where: { id },
            data: { likes: { decrement: 1 } },
          }),
        ]);

        const updatedComment = await this.prisma.forumComment.findUnique({
          where: { id },
          select: { likes: true },
        });

        return {
          success: true,
          likes: updatedComment?.likes || 0,
          liked: false,
        };
      } else {
        // Like: create a new like record and increment count
        const newId = randomUUID();
        await this.prisma.$transaction([
          this.prisma.$executeRaw`
                        INSERT INTO "ForumCommentLike" (id, "commentId", "userId", "createdAt") 
                        VALUES (${newId}, ${id}, ${userId}, ${new Date()})
                    `,
          this.prisma.forumComment.update({
            where: { id },
            data: { likes: { increment: 1 } },
          }),
        ]);

        const updatedComment = await this.prisma.forumComment.findUnique({
          where: { id },
          select: { likes: true },
        });

        return {
          success: true,
          likes: updatedComment?.likes || 0,
          liked: true,
        };
      }
    } catch (error) {
      console.error('[CommunityService] likeForumComment failed:', error);
      throw new BadRequestException('Failed to process like action on comment');
    }
  }

  async likeForumPost(userId: string, id: string) {
    console.log(
      `[CommunityService] likeForumPost called for user ${userId} and post ${id}`,
    );
    try {
      // Use raw query to bypass stale Prisma Client
      const existingLikes: any[] = await this.prisma.$queryRaw`
                SELECT id FROM "PostLike" 
                WHERE "postId" = ${id} AND "userId" = ${userId}
                LIMIT 1
            `;
      const existingLike = existingLikes[0];

      if (existingLike) {
        await this.prisma.$transaction([
          this.prisma
            .$executeRaw`DELETE FROM "PostLike" WHERE id = ${existingLike.id}`,
          this.prisma.forumPost.update({
            where: { id },
            data: { likes: { decrement: 1 } },
          }),
        ]);
        const updatedPost = await this.prisma.forumPost.findUnique({
          where: { id },
          select: { likes: true },
        });
        return { success: true, likes: updatedPost?.likes || 0, liked: false };
      } else {
        const newId = randomUUID();
        await this.prisma.$transaction([
          this.prisma.$executeRaw`
                        INSERT INTO "PostLike" (id, "postId", "userId", "createdAt") 
                        VALUES (${newId}, ${id}, ${userId}, ${new Date()})
                    `,
          this.prisma.forumPost.update({
            where: { id },
            data: { likes: { increment: 1 } },
          }),
        ]);
        const updatedPost = await this.prisma.forumPost.findUnique({
          where: { id },
          select: { likes: true },
        });
        return { success: true, likes: updatedPost?.likes || 0, liked: true };
      }
    } catch (error) {
      console.error('[CommunityService] likeForumPost failed:', error);
      throw new BadRequestException('Failed to process like action on post');
    }
  }

  async shareForumPost(id: string) {
    // Increment views as a proxy for share engagement since we track shares on client side mostly
    try {
      await this.prisma.forumPost.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      return { success: true, message: 'Post shared' };
    } catch (error) {
      throw new NotFoundException('Post not found');
    }
  }

  // ==================== MENTOR AUTH & DASHBOARD METHODS ====================

  // In-memory OTP storage (in production, use Redis or database)
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  async requestMentorOTP(email: string) {
    const mentor = await this.prisma.mentor.findUnique({
      where: { email },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor not found with this email');
    }

    if (!mentor.isApproved) {
      throw new BadRequestException(
        'Your mentor application is pending approval',
      );
    }

    if (!mentor.isActive) {
      throw new BadRequestException('Your mentor account is not active');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    this.otpStore.set(email, { otp, expiresAt });

    // In production, send OTP via email service (SendGrid, AWS SES, etc.)
    console.log(`\n🔐 OTP for ${email}: ${otp}\n`);
    console.log(`OTP expires at: ${expiresAt.toLocaleTimeString()}\n`);

    // TODO: Send email with OTP
    // await this.emailService.sendOTP(email, otp);

    return {
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
      data: {
        email,
        expiresIn: 300, // seconds
      },
    };
  }

  async verifyMentorOTP(email: string, otp: string) {
    const mentor = await this.prisma.mentor.findUnique({
      where: { email },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    // Check if OTP exists
    const storedOTP = this.otpStore.get(email);
    if (!storedOTP) {
      throw new BadRequestException('OTP not found. Please request a new OTP.');
    }

    // Check if OTP is expired
    if (new Date() > storedOTP.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    // Clear OTP after successful verification
    this.otpStore.delete(email);

    return {
      success: true,
      message: 'Login successful',
      data: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        university: mentor.university,
        isApproved: mentor.isApproved,
        isActive: mentor.isActive,
      },
    };
  }

  async getMentorProfile(mentorId: string) {
    const mentor = await this.prisma.mentor.findUnique({
      where: { id: mentorId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    // Get booking statistics
    const bookingStats = await this.prisma.mentorBooking.groupBy({
      by: ['status'],
      where: { mentorId },
      _count: true,
    });

    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
    };

    bookingStats.forEach((stat) => {
      stats.total += stat._count;
      stats[stat.status] = stat._count;
    });

    return {
      success: true,
      data: {
        mentor,
        stats,
      },
    };
  }

  async getMentorBookings(mentorId: string, filters: any) {
    const { status, limit, offset } = filters;

    const where: any = { mentorId };

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.mentorBooking.findMany({
        where,
        take: limit || 20,
        skip: offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mentorBooking.count({ where }),
    ]);

    return {
      success: true,
      data: bookings,
      pagination: {
        total,
        limit: limit || 20,
        offset: offset || 0,
        hasMore: (offset || 0) + bookings.length < total,
      },
    };
  }

  async updateBookingStatus(
    mentorId: string,
    bookingId: string,
    status: string,
  ) {
    // Verify booking belongs to mentor
    const booking = await this.prisma.mentorBooking.findFirst({
      where: {
        id: bookingId,
        mentorId,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or not authorized');
    }

    const updatedBooking = await this.prisma.mentorBooking.update({
      where: { id: bookingId },
      data: {
        status,
      },
    });

    return {
      success: true,
      message: `Booking ${status} successfully`,
      data: updatedBooking,
    };
  }

  async updateMentorProfile(mentorId: string, updateData: any) {
    const allowedFields = [
      'phone',
      'bio',
      'expertise',
      'linkedIn',
      'image',
      'isActive',
    ];

    const dataToUpdate = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        dataToUpdate[key] = updateData[key];
      }
    });

    const mentor = await this.prisma.mentor.update({
      where: { id: mentorId },
      data: dataToUpdate,
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: mentor,
    };
  }
}

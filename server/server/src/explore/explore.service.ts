import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityService } from '../community/community.service';
import { ReferenceService } from '../reference/reference.service';

@Injectable()
export class ExploreService {
    constructor(
        private prisma: PrismaService,
        private communityService: CommunityService,
        private referenceService: ReferenceService
    ) { }

    private readonly hubConfigs = {
        'loans': {
            title: 'Loans & Finance',
            badge: 'LOANS',
            description: 'Interest rates, banks, eligibility, and EMI planning.',
            advice: 'Get expert guidance on loan eligibility, documentation, and approval strategies.',
            categories: ['loan', 'finance', 'eligibility'],
            icon: 'payments'
        },
        'universities': {
            title: 'Universities',
            badge: 'UNIVERSITIES',
            description: 'Country filters, rank insights, and university discussions.',
            advice: 'Connect with alumni from top universities worldwide for insider perspectives.',
            categories: ['university', 'admission', 'ranking'],
            icon: 'school'
        },
        'courses': {
            title: 'Courses',
            badge: 'COURSES',
            description: 'MS, MBA, PhD, and specialized international programs.',
            advice: 'Get advice on course selection aligned with your career goals.',
            categories: ['course', 'curriculum', 'career'],
            icon: 'menu_book'
        },
        'stories': {
            title: 'Success Stories',
            badge: 'STORIES',
            description: 'Real student journeys, mistakes, and triumph reports.',
            advice: 'Read first-hand accounts of students who successfully moved abroad.',
            categories: ['story', 'success'],
            icon: 'lightbulb',
            isSpecialRoute: true,
            route: 'Success Stories'
        },
        'mentors': {
            title: 'Alumni & Mentors',
            badge: 'MENTORS',
            description: 'Verified advisors and successful student mentors.',
            advice: 'Book sessions with mentors who have actually walked the path.',
            categories: ['mentor', 'alumni'],
            icon: 'groups',
            isSpecialRoute: true,
            route: 'Alumni & Mentors'
        },
        'scholarships': {
            title: 'Scholarships',
            badge: 'SCHOLARSHIPS',
            description: 'Deadlines, alerts, and matching tailored to your profile.',
            advice: 'Learn from scholarship recipients about application strategies.',
            categories: ['scholarship', 'funding', 'grant'],
            icon: 'card_membership'
        },
        'accommodation': {
            title: 'Accommodation',
            badge: 'HOUSING',
            description: 'Find housing, roommates, and local living tips.',
            advice: 'Get practical advice on housing markets and safe neighborhoods.',
            categories: ['accommodation', 'housing', 'living'],
            icon: 'home'
        },
        'testprep': {
            title: 'Test Preparation',
            badge: 'TEST PREP',
            description: 'GRE, IELTS, TOEFL, GMAT, and SAT strategies.',
            advice: 'Learn from students who scored in the top percentiles.',
            categories: ['testprep', 'gre', 'ielts', 'toefl'],
            icon: 'edit_note'
        },
        'events': {
            title: 'Events & AMAs',
            badge: 'EVENTS',
            description: 'Live sessions with banks, alumni, and industry experts.',
            advice: 'Stay updated with upcoming webinars and expert sessions.',
            categories: ['event', 'ama'],
            icon: 'event',
            isSpecialRoute: true,
            route: 'Events & AMAs'
        },
        'visa': {
            title: 'Visa Support',
            badge: 'VISA',
            description: 'Application guides, interview tips, and checklists.',
            advice: 'Get insights on visa success stories and interview prep.',
            categories: ['visa', 'immigration', 'interview'],
            icon: 'flight'
        },
        'aitools': {
            title: 'AI Tools',
            badge: 'AI FEATURES',
            description: 'AI SOP writer, admit predictor, and loan advisors.',
            advice: 'Use our cutting-edge AI tools to streamline your journey.',
            categories: ['ai', 'tools'],
            icon: 'smart_toy'
        },
        'resources': {
            title: 'Resources',
            badge: 'RESOURCES',
            description: 'Download free guides, checklists, and templates.',
            advice: 'Access high-quality resources to help with your application.',
            categories: ['resource', 'guide'],
            icon: 'folder_open',
            isSpecialRoute: true,
            route: 'Resources'
        },
        'general': {
            title: 'General Discussion',
            badge: 'GENERAL',
            description: 'Connect with the community on any topic related to your study abroad journey.',
            advice: 'Connect with the community on diverse topics and share your unique experiences.',
            categories: ['general', 'discussion'],
            icon: 'forum',
            isHidden: true
        }
    };

    private _normalizeTopic(topic: string): string {
        let normalized = topic.toLowerCase();
        if (normalized === 'loan' || normalized === 'loans' || normalized === 'eligibility') return 'loans';
        if (normalized === 'admission' || normalized === 'admissions' || normalized === 'university') return 'universities';
        if (normalized === 'course') return 'courses';
        if (normalized === 'gre' || normalized === 'ielts' || normalized === 'toefl') return 'testprep';
        return normalized;
    }

    async getHubData(topic: string) {
        // Handle aliases and normalization
        const targetTopic = this._normalizeTopic(topic);

        const config = this.hubConfigs[targetTopic];
        if (!config) {
            throw new NotFoundException(`Explore Hub for topic '${topic}' not found`);
        }

        // Fetch dynamic data in parallel
        const [mentors, events, resources, stories, forumPosts] = await Promise.all([
            this.communityService.getAllMentors({ category: targetTopic, limit: 3 }),
            this.communityService.getAllEvents({ category: targetTopic, limit: 3 }),
            this.communityService.getAllResources({ category: targetTopic, limit: 3 }),
            this.communityService.getAllStories({ category: targetTopic, limit: 3 }),
            this.communityService.getForumPosts({ category: targetTopic, limit: 5 })
        ]);

        // Get total counts for stats
        const [activeMentorsCount, totalPostsCount] = await Promise.all([
            this.prisma.mentor.count({
                where: {
                    category: { equals: targetTopic },
                    isActive: true,
                    isApproved: true
                }
            }),
            this.prisma.forumPost.count({
                where: {
                    category: { equals: targetTopic }
                }
            })
        ]);

        return {
            success: true,
            data: {
                hub: {
                    topic: targetTopic, // Return normalized topic
                    originalTopic: topic,
                    title: config.title,
                    badge: config.badge,
                    description: config.description,
                    advice: config.advice,
                    icon: config.icon,
                    stats: {
                        activeMentors: activeMentorsCount,
                        discussions: totalPostsCount,
                        members: totalPostsCount * 3 + activeMentorsCount // Simulated member count
                    }
                },
                featuredMentorPost: (config as any).featuredPost,
                mentors: mentors.data,
                events: events.data,
                resources: resources.data,
                stories: stories.data,
                forumPosts: forumPosts.data
            }
        };
    }

    async getAllHubs() {
        return {
            success: true,
            data: Object.keys(this.hubConfigs)
                .filter(key => !this.hubConfigs[key].isHidden)
                .map(key => ({
                    id: key,
                    ...this.hubConfigs[key]
                }))
        };
    }

    async getHubPosts(topic: string, sort?: string, userId?: string) {
        const category = this._normalizeTopic(topic);

        return this.communityService.getForumPosts({
            category: category,
            sort: sort || 'newest',
            limit: 20
        }, userId);
    }

    async createHubPost(userId: string, topic: string, data: any) {
        const category = this._normalizeTopic(topic);

        // Override category in data with the hub topic
        const postData = {
            ...data,
            category: category
        };

        return this.communityService.createForumPost(userId, postData);
    }
}

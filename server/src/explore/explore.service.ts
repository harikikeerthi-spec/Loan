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
        'eligibility': {
            title: 'Loan Eligibility & Finance',
            badge: 'ELIGIBILITY',
            description: 'Navigate the complexities of loan approvals, credit scores, and financial planning.',
            advice: 'Get expert guidance on loan eligibility, documentation, and approval strategies from those who\'ve been through it.',
            featuredPost: {
                question: 'What challenges are you facing with loan eligibility?',
                description: 'Our mentor team includes bank relationship managers and students who successfully secured education loans. Ask us about credit scores, collateral requirements, or improving your eligibility.',
                advice: 'Get expert guidance on loan eligibility, documentation, and approval strategies from those who\'ve been through it.'
            },
            categories: ['loan', 'finance', 'eligibility'],
            icon: 'payments'
        },
        'universities': {
            title: 'University Selection & Rankings',
            badge: 'UNIVERSITIES',
            description: 'Explore top global universities, program quality, and campus life insights.',
            advice: 'Connect with alumni from top universities worldwide for insider perspectives on university life and academics.',
            featuredPost: {
                question: 'Need help choosing the right university?',
                description: 'Our mentors are alumni from top global universities. Ask about rankings, program quality, campus life, ROI, or specific university comparisons.',
                advice: 'Connect with alumni from top universities worldwide for insider perspectives on university life and academics.'
            },
            categories: ['university', 'admission', 'ranking'],
            icon: 'school'
        },
        'courses': {
            title: 'Course & Program Guidance',
            badge: 'COURSES',
            description: 'Find the right program for your career goals, from STEM to Business.',
            advice: 'Our mentors have pursued diverse programs. Get advice on course selection aligned with your career goals.',
            featuredPost: {
                question: 'Confused about which program to choose?',
                description: 'Ask mentors about MS vs MBA, specialized programs, curriculum details, career outcomes, or switching fields.',
                advice: 'Our mentors have pursued diverse programs - from STEM to Business. Get advice on course selection aligned with your career goals.'
            },
            categories: ['course', 'curriculum', 'career'],
            icon: 'menu_book'
        },
        'scholarships': {
            title: 'Scholarships & Grants',
            badge: 'SCHOLARSHIPS',
            description: 'Discover funding opportunities and learn how to write winning applications.',
            advice: 'Learn from scholarship recipients about deadlines, application strategies, and lesser-known funding sources.',
            featuredPost: {
                question: 'Looking for scholarship opportunities?',
                description: 'Mentors who won scholarships share tips on finding opportunities, writing winning applications, and maximizing financial aid.',
                advice: 'Learn from scholarship recipients about deadlines, application strategies, and lesser-known funding sources.'
            },
            categories: ['scholarship', 'funding', 'grant'],
            icon: 'card_membership'
        },
        'visa': {
            title: 'Visa & Immigration',
            badge: 'VISA',
            description: 'Step-by-step guidance on visa interviews, documentation, and processes.',
            advice: 'Get insights on visa success stories, rejection reasons to avoid, and country-specific visa nuances.',
            featuredPost: {
                question: 'Visa application got you stressed?',
                description: 'Mentors share their visa interview experiences, document preparation tips, and how to handle common visa officer questions.',
                advice: 'Get insights on visa success stories, rejection reasons to avoid, and country-specific visa nuances.'
            },
            categories: ['visa', 'immigration', 'interview'],
            icon: 'demography'
        },
        'accommodation': {
            title: 'Housing & Accommodation',
            badge: 'ACCOMMODATION',
            description: 'Find safe, affordable housing and learn about living abroad.',
            advice: 'Get practical advice on housing markets, safe neighborhoods, and avoiding common rental pitfalls.',
            featuredPost: {
                question: 'Worried about finding housing abroad?',
                description: 'Current students and alumni share tips on finding accommodation, navigating lease agreements, roommate searches, and budget-friendly living.',
                advice: 'Get practical advice on housing markets, safe neighborhoods, and avoiding common rental pitfalls in different countries.'
            },
            categories: ['accommodation', 'housing', 'living'],
            icon: 'home'
        },
        'gre': {
            title: 'Test Prep (GRE/IELTS/TOEFL)',
            badge: 'TEST PREP',
            description: 'Master your exams with proven strategies and study resources.',
            advice: 'Learn from students who scored 320+ on GRE, 8+ on IELTS, and 110+ on TOEFL about effective preparation.',
            featuredPost: {
                question: 'Need test prep strategies and resources?',
                description: 'High scorers share study plans, resources, test-taking strategies, and tips to improve your scores.',
                advice: 'Learn from students who scored 320+ on GRE, 8+ on IELTS, and 110+ on TOEFL about effective preparation methods.'
            },
            categories: ['testprep', 'gre', 'ielts', 'toefl'],
            icon: 'edit_note'
        },
        'jobs': {
            title: 'Part-time Jobs & Careers',
            badge: 'JOBS',
            description: 'Kickstart your career with part-time work and internship guidance.',
            advice: 'Learn about legal work hours, resume tips for local markets, and networking strategies for your career.',
            featuredPost: {
                question: 'Looking for work opportunities?',
                description: 'Get advice on finding part-time jobs while studying, internships, and post-study work opportunities in different countries.',
                advice: 'Learn about legal work hours, resume tips for local markets, and networking strategies for your career.'
            },
            categories: ['jobs', 'careers', 'internships'],
            icon: 'work'
        },
        'general': {
            title: 'General Discussion',
            badge: 'GENERAL',
            description: 'Connect with the community on any topic related to your study abroad journey.',
            advice: 'Connect with the community on diverse topics and share your unique experiences.',
            featuredPost: {
                question: 'Have a general query?',
                description: 'Discuss anything related to study abroad, student life, travel tips, or topics not covered in other categories.',
                advice: 'Connect with the community on diverse topics and share your unique experiences.'
            },
            categories: ['general', 'discussion'],
            icon: 'forum'
        }
    };

    async getHubData(topic: string) {
        // Handle aliases
        let targetTopic = topic;
        if (topic === 'loan') targetTopic = 'eligibility';

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
                    category: { contains: targetTopic, mode: 'insensitive' },
                    isActive: true,
                    isApproved: true
                }
            }),
            this.prisma.forumPost.count({
                where: {
                    category: { contains: targetTopic, mode: 'insensitive' }
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
                featuredMentorPost: config.featuredPost,
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
            data: Object.keys(this.hubConfigs).map(key => ({
                id: key,
                ...this.hubConfigs[key]
            }))
        };
    }

    async getHubPosts(topic: string, sort?: string, userId?: string) {
        let category = topic;
        if (topic === 'loan') category = 'eligibility';

        // Ensure category is valid or at least one of our hubs? 
        // For now, we trust the topic or map it if needed.

        return this.communityService.getForumPosts({
            category: category,
            sort: sort || 'newest',
            limit: 20
        }, userId);
    }

    async createHubPost(userId: string, topic: string, data: any) {
        let category = topic;
        if (topic === 'loan') category = 'eligibility';

        // Override category in data with the hub topic
        const postData = {
            ...data,
            category: category
        };

        return this.communityService.createForumPost(userId, postData);
    }
}

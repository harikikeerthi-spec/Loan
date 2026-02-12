import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ExploreService } from './explore.service';
import { UserGuard } from '../auth/user.guard';

import { JwtService } from '@nestjs/jwt';

@Controller('community/explore')
export class ExploreController {
    constructor(
        private exploreService: ExploreService,
        private jwtService: JwtService
    ) { }

    @Get('hubs')
    async getAllHubs() {
        return this.exploreService.getAllHubs();
    }

    @Get('hub/:topic')
    async getHubData(@Param('topic') topic: string) {
        return this.exploreService.getHubData(topic);
    }

    @Get('hub/:topic/forum')
    async getHubPosts(
        @Param('topic') topic: string,
        @Request() req,
        @Query('sort') sort?: string,
    ) {
        let userId: string | undefined;
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = this.jwtService.decode(token) as any;
                if (decoded && decoded.id) {
                    userId = decoded.id;
                }
            }
        } catch (e) {
            // ignore
        }
        return this.exploreService.getHubPosts(topic, sort, userId);
    }

    @Post('hub/:topic/forum')
    @UseGuards(UserGuard)
    async createHubPost(
        @Request() req,
        @Param('topic') topic: string,
        @Body() body: any
    ) {
        console.log(`[ExploreController] createHubPost called for topic: ${topic}`);
        console.log(`[ExploreController] User: ${req.user?.id}`);
        console.log(`[ExploreController] Body:`, body);
        return this.exploreService.createHubPost(req.user.id, topic, body);
    }
}

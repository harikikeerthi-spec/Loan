import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExploreService } from './explore.service';

@Controller('community/explore')
export class ExploreController {
    constructor(private exploreService: ExploreService) { }

    @Get('hubs')
    async getAllHubs() {
        return this.exploreService.getAllHubs();
    }

    @Get('hub/:topic')
    async getHubData(@Param('topic') topic: string) {
        return this.exploreService.getHubData(topic);
    }
}

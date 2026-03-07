import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ConnectedService } from './connected.service';
import { CreateCohortApplicationDto } from './dto/create-cohort-application.dto';

@Controller('connected')
export class ConnectedController {
    constructor(private readonly connectedService: ConnectedService) { }

    /** POST /api/connected/apply — public endpoint, saves form submission */
    @Post('apply')
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateCohortApplicationDto) {
        return this.connectedService.create(dto);
    }

    /** GET /api/connected/applications?status=pending — admin */
    @Get('applications')
    findAll(@Query('status') status?: string) {
        return this.connectedService.findAll(status);
    }

    /** PATCH /api/connected/applications/:id/status — admin */
    @Patch('applications/:id/status')
    updateStatus(
        @Param('id') id: string,
        @Body()
        body: { status: string; reviewedBy?: string; reviewNotes?: string },
    ) {
        return this.connectedService.updateStatus(
            id,
            body.status,
            body.reviewedBy,
            body.reviewNotes,
        );
    }
}

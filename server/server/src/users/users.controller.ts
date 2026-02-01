import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('profile')
    async getProfile(@Body() body: { email: string }) {
        const user = await this.usersService.findOne(body.email);

        if (!user) {
            return {
                success: false,
                message: 'User not found',
            };
        }

        // Format date of birth to DD-MM-YYYY if it exists
        let formattedDOB = '';
        if (user.dateOfBirth) {
            const date = new Date(user.dateOfBirth);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            formattedDOB = `${day}-${month}-${year}`;
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                dateOfBirth: formattedDOB,
                mobile: user.mobile,
                role: user.role,
            },
        };
    }
}

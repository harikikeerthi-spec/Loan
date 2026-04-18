import { Controller, Get, Post, Body, UseGuards, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminGuard } from '../auth/admin.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { EmailService } from '../auth/email.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly emailService: EmailService,
    ) { }

    @Post('profile')
    async getProfile(@Body() body: { email: string }) {
        if (!body || !body.email) {
            return {
                success: false,
                message: 'Email is required',
            };
        }
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

    // Admin: list all users (limited fields)
    @Get('admin/list')
    @UseGuards(AdminGuard)
    async listUsers() {
        try {
            const users = await this.usersService.findAll();
            if (!users) return { success: true, data: [] };
            
            return {
                success: true,
                data: users.map(u => ({ 
                    id: u?.id || '', 
                    email: u?.email || '', 
                    firstName: u?.firstName || '', 
                    lastName: u?.lastName || '', 
                    role: u?.role || 'user', 
                    createdAt: u?.createdAt || new Date().toISOString()
                }))
            };
        } catch (error) {
            console.error('Error in listUsers:', error);
            return {
                success: false,
                message: error.message || 'Failed to list users',
                data: []
            };
        }
    }

    @UseGuards(SuperAdminGuard)
    @Post('make-admin')
    async makeAdmin(@Body() body: { email: string; role: string }) {
        if (!body || !body.email || !body.role) {
            return {
                success: false,
                message: 'Email and role are required',
            };
        }
        const allowedRoles = ['admin', 'user', 'staff', 'super_admin', 'agent', 'bank'];
        if (!allowedRoles.includes(body.role)) {
            return {
                success: false,
                message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`,
            };
        }

        const user = await this.usersService.findOne(body.email);
        if (!user) {
            return {
                success: false,
                message: 'User not found',
            };
        }

        const updated = await this.usersService.updateUserRole(body.email, body.role as any);
        return {
            success: true,
            message: `User ${body.email} role updated to '${body.role}'`,
            user: {
                id: updated.id,
                email: updated.email,
                firstName: updated.firstName,
                lastName: updated.lastName,
                role: updated.role,
            },
        };
    }

    @UseGuards(AdminGuard)
    @Post('admin/send-email')
    async sendAdminEmail(
        @Body() body: { 
            to: string; 
            subject: string; 
            content: string; 
            role?: string; 
            isBulk?: boolean 
        }
    ) {
        if (!body || !body.subject || !body.content) {
            return { success: false, message: 'Subject and content are required' };
        }

        try {
            if (body.isBulk && body.role) {
                const users = await this.usersService.findAll();
                const filteredUsers = users.filter(u => u.role === body.role);
                
                for (const u of filteredUsers) {
                    await this.emailService.sendMail(
                        u.email,
                        body.subject,
                        `<div style="font-family: sans-serif; padding: 20px;">${body.content}</div>`,
                        body.content
                    );
                }
                
                return { 
                    success: true, 
                    message: `Email sent to ${filteredUsers.length} users with role '${body.role}'` 
                };
            } else if (body.to) {
                await this.emailService.sendMail(
                    body.to,
                    body.subject,
                    `<div style="font-family: sans-serif; padding: 20px;">${body.content}</div>`,
                    body.content
                );
                return { success: true, message: `Email sent to ${body.to}` };
            } else {
                return { success: false, message: 'Recipient email or role is required' };
            }
        } catch (error) {
            console.error('Error sending admin email:', error);
            return { success: false, message: 'Failed to send email' };
        }
    }

    @UseGuards(AdminGuard)
    @Post('admin/create')
    async adminCreateUser(
        @Body() body: { 
            email: string; 
            firstName: string; 
            lastName: string; 
            mobile: string; 
            role: string 
        }
    ) {
        if (!body || !body.email || !body.role) {
            return { success: false, message: 'Email and role are required' };
        }

        const existing = await this.usersService.findOne(body.email);
        if (existing) {
            return { success: false, message: 'User with this email already exists' };
        }

        try {
            const newUser = await this.usersService.create({
                email: body.email,
                firstName: body.firstName,
                lastName: body.lastName,
                mobile: body.mobile,
                role: body.role,
                password: Math.random().toString(36).slice(-12), // Generate a dummy password
            });

            // Send invitation/welcome email
            await this.emailService.sendMail(
                newUser.email,
                `Welcome to VidhyaLoan - Your ${body.role} Account`,
                `<div style="font-family: sans-serif; padding: 20px;">
                    <h2>Welcome to the Matrix, ${body.firstName}!</h2>
                    <p>Your account as an <strong>${body.role}</strong> has been created by the administrator.</p>
                    <p>You can now log in using your email: <strong>${body.email}</strong></p>
                    <p>Proceed to the dashboard to complete your profile.</p>
                </div>`,
                `Welcome to VidhyaLoan! Your ${body.role} account has been created.`
            );

            return { 
                success: true, 
                message: 'User created successfully', 
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    role: newUser.role
                } 
            };
        } catch (error) {
            console.error('Error creating user by admin:', error);
            return { success: false, message: 'Failed to create user' };
        }
    }

    @UseGuards(AdminGuard)
    @Post('admin/update-details')
    async adminUpdateUser(
        @Body() body: { 
            email: string; 
            firstName: string; 
            lastName: string; 
            phoneNumber: string; 
            dateOfBirth: string 
        }
    ) {
        if (!body || !body.email) {
            return { success: false, message: 'Email is required' };
        }
        const updated = await this.usersService.updateUserDetails(
            body.email,
            body.firstName,
            body.lastName,
            body.phoneNumber,
            body.dateOfBirth
        );
        return { success: true, message: 'User updated successfully', user: updated };
    }
}

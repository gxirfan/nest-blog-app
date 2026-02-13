import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import {
  UpdateMeDto,
  UpdateUserByAdminDto,
  UpdateUserPasswordDto,
} from './dto/update-user.dto';
import { CreateUserRequestDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  //create
  async create(
    userDto: CreateUserRequestDto,
  ): Promise<UserDocument & { recoveryCodes: string[] }> {
    try {
      const hashedPassword = await this.hashPassword(userDto.password);

      if (!userDto.nickname) userDto.nickname = userDto.username;

      const newUser = new this.userModel({
        ...userDto,
        passwordHash: hashedPassword,
      });

      const savedUser = await newUser.save();

      const recoveryCodes = await this.generateAndSaveRecoveryCodes(
        savedUser.id,
      );

      const userWithCodes = savedUser.toObject();

      userWithCodes.recoveryCodes = recoveryCodes;

      // return mongoose document (js object) with recovery codes
      return userWithCodes as UserDocument & { recoveryCodes: string[] };
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB Duplicate Key
        throw new ConflictException('username or email is already taken.'); // 409 Conflict
      }
      throw new InternalServerErrorException(
        'User registration failed due to an unexpected error.',
      );
    }
  }

  //read
  async findAll(): Promise<UserDocument[]> {
    const users = await this.userModel.find().exec();
    if (!users) throw new NotFoundException('Users not found');
    if (users.length === 0) throw new NotFoundException('Users not found');
    return users;
  }

  //using session serializer
  async findOneByIdAsDocument(id: string): Promise<UserDocument | null> {
    return (await this.userModel.findById(id).exec()) || null;
  }

  //using auth validation
  async findOneByUsernameAsDocument(loginField: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ $or: [{ username: loginField }, { email: loginField }] })
      .select('+passwordHash')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByUsername(username: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  //using-for-password-reset
  async findOneByLoginField(loginField: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({
        $or: [{ email: loginField.toLowerCase() }, { username: loginField }],
      })
      .select('+resetPasswordToken')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByResetToken(token: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpiresAt: { $gt: Date.now() },
      })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async generateAndSaveRecoveryCodes(userId: string): Promise<string[]> {
    const NUMBER_OF_CODES = 5;
    const codes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < NUMBER_OF_CODES; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
      const hashed = await this.hashPassword(code);
      hashedCodes.push(hashed);
    }

    await this.userModel
      .updateOne({ _id: userId }, { recoveryCodes: hashedCodes })
      .exec();

    return codes;
  }

  async findOneByUsernameWithCodes(username: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ username })
      .select('+recoveryCodes')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByUsernameForPublicProfile(
    username: string,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ username })
      .select('+isEmailPublic')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  //update
  async update(id: string, user: UpdateMeDto): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, user, { new: true })
      .exec();
    if (!updatedUser) throw new NotFoundException('User not found');
    return updatedUser;
  }

  async updateUserMedia(
    userId: string,
    updatePayload: { avatar?: string; cover?: string },
  ): Promise<UserDocument> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updatePayload }, { new: true })
      .exec();

    if (!updatedUser)
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);

    return updatedUser;
  }

  async updatePassword(
    id: string,
    user: UpdateUserPasswordDto,
  ): Promise<UserDocument> {
    const foundUser = await this.userModel
      .findById(id)
      .select('+passwordHash')
      .exec();
    if (!foundUser) throw new NotFoundException('User not found');

    const isMatch = await this.comparePassword(
      user.oldPassword,
      foundUser.passwordHash,
    );
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    foundUser.passwordHash = await this.hashPassword(user.newPassword);
    return await foundUser.save();
  }

  //admin
  async updateUserById(
    id: string,
    user: UpdateUserByAdminDto,
    adminId: string,
  ): Promise<UserDocument> {
    // const updatedUser = await this.userModel
    //   .findByIdAndUpdate(id, user, { new: true })
    //   .exec();
    // if (!updatedUser) throw new NotFoundException('User not found');
    // return updatedUser;

    const existingUser = await this.userModel.findById(id).exec();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const adminUser = await this.userModel.findById(adminId).exec();
    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    if (existingUser.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot be modified via this endpoint for security reasons.',
      );
    }

    if (
      adminUser.role !== UserRole.ADMIN &&
      adminUser.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException('Only admin or moderator can update user.');
    }

    if (
      existingUser.role &&
      adminUser.role &&
      adminUser.role === existingUser.role
    ) {
      throw new ForbiddenException('You cannot update this user.');
    }

    if (adminUser.role === UserRole.MODERATOR)
      if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR)
        throw new ForbiddenException('You cannot update this user.');

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, user, { new: true })
      .exec();

    if (!updatedUser) throw new NotFoundException('User not found');

    return updatedUser;
  }

  async updatePasswordById(
    id: string,
    newPassword: string,
    adminId: string,
  ): Promise<UserDocument> {
    // const updatedUser = await this.userModel
    //   .findByIdAndUpdate(
    //     id,
    //     { passwordHash: await this.hashPassword(newPassword) },
    //     { new: true },
    //   )
    //   .exec();
    // if (!updatedUser) throw new NotFoundException('User not found');
    // return updatedUser;

    const existingUser = await this.userModel.findById(id).exec();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const adminUser = await this.userModel.findById(adminId).exec();
    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    if (existingUser.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot be modified via this endpoint for security reasons.',
      );
    }

    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can update user password.');
    }

    existingUser.passwordHash = await this.hashPassword(newPassword);

    return await existingUser.save();
  }

  async deleteUserById(id: string, adminId: string): Promise<UserDocument> {
    const existingUser = await this.userModel.findById(id).exec();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const adminUser = await this.userModel.findById(adminId).exec();
    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    if (existingUser.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot be modified via this endpoint for security reasons.',
      );
    }

    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can delete user.');
    }

    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) throw new NotFoundException('User not found');
    return deletedUser;
  }
}

import { NotImplementedException, Post } from '@nestjs/common';
import { Int, Mutation } from '@nestjs/graphql';
import {
  Args,
  ID,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AddEmail, EmailFiltersArgs, UserEmail } from './email.types';
import { User } from '../user/user.types';
import { DeleteResult, Equal, FindOptionsWhere, Repository } from 'typeorm';
import { EmailEntity } from './email.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { EmailId } from './email.interfaces';
import { GraphQLScalarType } from 'graphql';

@Resolver(() => UserEmail)
export class EmailResolver {
  constructor(
    private readonly _service: UserService,
    @InjectRepository(EmailEntity)
    private readonly emailRepository: Repository<EmailEntity>,
  ) {}

  @Query(() => UserEmail, { name: 'email' })
  getEmail(@Args({ name: 'emailId', type: () => ID }) emailId: string) {
    const where: FindOptionsWhere<UserEmail> = {
      id: Equal(emailId),
    };

    return this.emailRepository.findOne({
      where,
      order: { address: 'asc' },
    });
  }

  @Mutation(() => ID)
  async addEmailToUser(@Args() email: AddEmail): Promise<EmailId> {
    const addedEmail = await this.emailRepository.insert(email);
    const emailId = addedEmail.identifiers[0].id;
    return emailId;
  }

  @Mutation(() => Int)
  async removeEmailToUser(@Args('emailId') emailId: string) {
    return (await this.emailRepository.delete(emailId)).affected;
  }

  @Query(() => [UserEmail], { name: 'emailsList' })
  async getEmails(@Args() filters: EmailFiltersArgs): Promise<UserEmail[]> {
    const where: FindOptionsWhere<EmailEntity>[] = [];

    if (filters.address) {
      if (filters.address.equal) {
        where.push({
          address: Equal(filters.address.equal),
        });
      }
    }

    return this.emailRepository.find({
      where,
      order: { address: 'asc' },
    });
  }

  @ResolveField(() => User, { name: 'user' })
  async getUser(@Parent() parent: UserEmail): Promise<User> {
    return this._service.get(parent.userId);
  }
}

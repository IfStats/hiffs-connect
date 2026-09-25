import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class ContactGroupMemberDto {
  @IsString()
  @IsNotEmpty()
  contactId!: string;
}
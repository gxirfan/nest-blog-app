import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAtLeast18', async: false })
export class IsAtLeast18Constraint implements ValidatorConstraintInterface {
  validate(birthDate: any) {
    if (!(birthDate instanceof Date) || isNaN(birthDate.getTime()))
      return false;

    const today = new Date();
    const minDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );

    return birthDate <= minDate;
  }

  defaultMessage() {
    return 'You must be at least 18 years old to register.';
  }
}

export function IsAtLeast18(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAtLeast18Constraint,
    });
  };
}

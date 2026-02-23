import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAgeValid', async: false })
class IsAgeValidConstraint implements ValidatorConstraintInterface {
  validate(birthDate: any) {
    if (!(birthDate instanceof Date) || isNaN(birthDate.getTime()))
      return false;

    const today = new Date();

    const minAgeDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );

    const maxAgeDate = new Date(
      today.getFullYear() - 80,
      today.getMonth(),
      today.getDate(),
    );

    return birthDate <= minAgeDate && birthDate >= maxAgeDate;
  }

  defaultMessage() {
    return 'Identity validation failed: Age must be between 18 and 80 years.';
  }
}

export function IsAgeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAgeValidConstraint,
    });
  };
}

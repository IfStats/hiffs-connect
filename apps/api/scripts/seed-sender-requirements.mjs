import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL_UNPOOLED or DATABASE_URL is required',
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const requirements = [
  /*
   * INFOBIP — GHANA
   *
   * General Infobip registration fields are known,
   * but country-specific Ghana documentation should
   * still be confirmed through Infobip requirements/API.
   */
  {
    provider: 'infobip',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'SENDER_FORMAT',
    name: 'Sender ID format',
    description:
      'Alphanumeric sender ID must normally contain 3 to 11 characters.',
    required: true,
    fieldKey: 'senderValue',
    documentType: null,
    validationRule: {
      minLength: 3,
      maxLength: 11,
      pattern: '^[A-Za-z0-9]+$',
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'USE_CASE',
    name: 'Messaging use case',
    description:
      'Describe how the sender ID will be used.',
    required: true,
    fieldKey: 'useCase',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'MESSAGE_EXAMPLE',
    name: 'Sample message',
    description:
      'Provide an example of the SMS content that will be sent.',
    required: true,
    fieldKey: 'sampleMessage',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'COMPANY_NAME',
    name: 'Company name',
    description:
      'Legal or trading name of the requesting business.',
    required: true,
    fieldKey: 'companyName',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'COMPANY_WEBSITE',
    name: 'Company website',
    description:
      'Website associated with the requesting business or brand.',
    required: true,
    fieldKey: 'companyWebsite',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'TRAFFIC_TYPE',
    name: 'Traffic type',
    description:
      'Specify whether traffic is transactional, promotional or another supported category.',
    required: true,
    fieldKey: 'trafficType',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'TRAFFIC_ORIGIN',
    name: 'Traffic origin',
    description:
      'Specify whether the sender/business traffic is local or international.',
    required: true,
    fieldKey: 'trafficOrigin',
    documentType: null,
    validationRule: {
      allowedValues: [
        'LOCAL',
        'INTERNATIONAL',
      ],
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'PROVIDER_CONFIRMATION',
    name: 'Confirm Ghana-specific provider requirements',
    description:
      'Hiffs Connect must confirm current Ghana/operator requirements with Infobip before final provider submission.',
    required: true,
    fieldKey: null,
    documentType: null,
    validationRule: {
      workflowOnly: true,
    },
    active: true,
  },

  /*
   * INFOBIP — NIGERIA
   */
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'SENDER_FORMAT',
    name: 'Sender ID format',
    description:
      'Generic senders and special characters are prohibited. Political sender IDs are not permitted.',
    required: true,
    fieldKey: 'senderValue',
    documentType: null,
    validationRule: {
      minLength: 3,
      maxLength: 11,
      pattern: '^[A-Za-z0-9]+$',
      genericSenderProhibited: true,
      politicalSenderProhibited: true,
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'TRAFFIC_ORIGIN',
    name: 'Traffic origin',
    description:
      'Nigeria requirements differ for local and international senders.',
    required: true,
    fieldKey: 'trafficOrigin',
    documentType: null,
    validationRule: {
      allowedValues: [
        'LOCAL',
        'INTERNATIONAL',
      ],
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'TRAFFIC_TYPE',
    name: 'Traffic type',
    description:
      'Specify promotional, transactional or applicable traffic classification.',
    required: true,
    fieldKey: 'trafficType',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'COMPANY_NAME',
    name: 'Company name',
    description:
      'Company name required for sender registration.',
    required: true,
    fieldKey: 'companyName',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'COMPANY_ADDRESS',
    name: 'Company address',
    description:
      'Required for a Nigerian local sender registration.',
    required: true,
    fieldKey: 'companyAddress',
    documentType: null,
    validationRule: {
      when: {
        trafficOrigin: 'LOCAL',
      },
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'COMPANY_PHONE',
    name: 'Company phone number',
    description:
      'Required for a Nigerian local sender registration.',
    required: true,
    fieldKey: 'companyPhone',
    documentType: null,
    validationRule: {
      when: {
        trafficOrigin: 'LOCAL',
      },
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'COMPANY_WEBSITE',
    name: 'Company website',
    description:
      'Website associated with the business.',
    required: true,
    fieldKey: 'companyWebsite',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'COMPANY_INDUSTRY',
    name: 'Company industry',
    description:
      'Required for local Nigerian sender registration.',
    required: true,
    fieldKey: 'companyIndustry',
    documentType: null,
    validationRule: {
      when: {
        trafficOrigin: 'LOCAL',
      },
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'CAC_NUMBER',
    name: 'CAC registration number',
    description:
      'Corporate Affairs Commission registration number for local Nigerian entities.',
    required: true,
    fieldKey: 'cacNumber',
    documentType: null,
    validationRule: {
      when: {
        trafficOrigin: 'LOCAL',
      },
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'CAC_CERTIFICATE',
    name: 'CAC certificate',
    description:
      'Certificate of incorporation required for local Nigerian sender registration.',
    required: true,
    fieldKey: null,
    documentType: 'CAC_CERTIFICATE',
    validationRule: {
      when: {
        trafficOrigin: 'LOCAL',
      },
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'USE_CASE',
    name: 'Use case description',
    description:
      'Describe the purpose of the SMS traffic.',
    required: true,
    fieldKey: 'useCase',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'MONTHLY_VOLUME',
    name: 'Estimated monthly volume',
    description:
      'Estimated monthly SMS volume.',
    required: true,
    fieldKey: 'estimatedMonthlyVolume',
    documentType: null,
    validationRule: null,
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'CONTACT_DETAILS',
    name: 'Registration contact details',
    description:
      'International registrations require contact person, email and mobile details.',
    required: true,
    fieldKey: 'registrationContact',
    documentType: null,
    validationRule: {
      when: {
        trafficOrigin: 'INTERNATIONAL',
      },
    },
    active: true,
  },
  {
    provider: 'infobip',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'LOA',
    name: 'Letter of Authorization',
    description:
      'Authorization documentation may be required for local Nigerian registration and operator approval.',
    required: true,
    fieldKey: null,
    documentType: 'LETTER_OF_AUTHORIZATION',
    validationRule: {
      when: {
        trafficOrigin: 'LOCAL',
      },
    },
    active: true,
  },

  /*
   * ROUTE MOBILE — GHANA
   *
   * Public Route Mobile documentation confirms sender
   * format constraints but not the complete country
   * registration-document checklist.
   */
  {
    provider: 'routemobile',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'SENDER_FORMAT',
    name: 'Sender ID format',
    description:
      'Route Mobile supports a maximum of 11 characters for an alphanumeric sender ID. Destination carriers may impose additional restrictions.',
    required: true,
    fieldKey: 'senderValue',
    documentType: null,
    validationRule: {
      maxLength: 11,
      providerCountryConfirmationRequired: true,
    },
    active: true,
  },
  {
    provider: 'routemobile',
    countryCode: 'GH',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'PROVIDER_CONFIRMATION',
    name: 'Confirm Ghana registration requirements',
    description:
      'Country/operator registration documentation must be confirmed with Route Mobile before submission.',
    required: true,
    fieldKey: null,
    documentType: null,
    validationRule: {
      workflowOnly: true,
    },
    active: true,
  },

  /*
   * ROUTE MOBILE — NIGERIA
   */
  {
    provider: 'routemobile',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'SENDER_FORMAT',
    name: 'Sender ID format',
    description:
      'Route Mobile supports a maximum of 11 characters for an alphanumeric sender ID. Nigerian carrier restrictions may apply.',
    required: true,
    fieldKey: 'senderValue',
    documentType: null,
    validationRule: {
      maxLength: 11,
      providerCountryConfirmationRequired: true,
    },
    active: true,
  },
  {
    provider: 'routemobile',
    countryCode: 'NG',
    channel: 'SMS',
    senderType: 'DEDICATED',
    key: 'PROVIDER_CONFIRMATION',
    name: 'Confirm Nigeria registration requirements',
    description:
      'Current Nigeria sender registration documentation and operator requirements must be confirmed with Route Mobile before provider submission.',
    required: true,
    fieldKey: null,
    documentType: null,
    validationRule: {
      workflowOnly: true,
    },
    active: true,
  },
];

async function main() {
  let upserted = 0;

  for (const requirement of requirements) {
    await prisma.senderRequirement.upsert({
      where: {
        provider_countryCode_channel_senderType_key: {
          provider: requirement.provider,
          countryCode: requirement.countryCode,
          channel: requirement.channel,
          senderType: requirement.senderType,
          key: requirement.key,
        },
      },

      update: {
        name: requirement.name,
        description:
          requirement.description,
        required:
          requirement.required,
        fieldKey:
          requirement.fieldKey,
        documentType:
          requirement.documentType,
        validationRule:
          requirement.validationRule,
        active:
          requirement.active,
      },

      create: requirement,
    });

    upserted += 1;
  }

  console.log(
    `Sender requirement registry seeded: ${upserted} requirements`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
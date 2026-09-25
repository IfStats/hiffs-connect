export type SmsEncoding =
  | 'GSM7'
  | 'UCS2';

export type SmsUsage = {
  characterCount: number;
  encoding: SmsEncoding;
  segmentCount: number;
  unitsUsed: number;
  singleSegmentLimit: number;
  multipartSegmentLimit: number;
};

const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

const GSM7_EXTENSION =
  '^{}\\[~]|€';

function calculateGsm7Septets(
  text: string,
): number | null {
  let septets = 0;

  for (const character of text) {
    if (
      GSM7_BASIC.includes(character)
    ) {
      septets += 1;
      continue;
    }

    if (
      GSM7_EXTENSION.includes(
        character,
      )
    ) {
      septets += 2;
      continue;
    }

    return null;
  }

  return septets;
}

export function calculateSmsUsage(
  text: string,
): SmsUsage {
  const gsm7Septets =
    calculateGsm7Septets(text);

  if (gsm7Septets !== null) {
    const segmentCount =
      gsm7Septets <= 160
        ? 1
        : Math.ceil(
            gsm7Septets / 153,
          );

    return {
      characterCount: text.length,
      encoding: 'GSM7',
      segmentCount,
      unitsUsed: gsm7Septets,
      singleSegmentLimit: 160,
      multipartSegmentLimit: 153,
    };
  }

  /*
   * JavaScript string length counts UTF-16
   * code units, which is appropriate for our
   * UCS-2/Unicode SMS segment calculation.
   */
  const unitsUsed = text.length;

  const segmentCount =
    unitsUsed <= 70
      ? 1
      : Math.ceil(
          unitsUsed / 67,
        );

  return {
    characterCount: text.length,
    encoding: 'UCS2',
    segmentCount,
    unitsUsed,
    singleSegmentLimit: 70,
    multipartSegmentLimit: 67,
  };
}
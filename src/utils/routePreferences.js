export const RIDE_PREFERENCES = [
  {value: 'quiet', icon: 'volume-off', labelKey: 'Quiet ride'},
  {value: 'music', icon: 'music', labelKey: 'Music ride'},
  {value: 'conversation', icon: 'chat-outline', labelKey: 'Conversation ride'},
];

export const LUGGAGE_SIZES = [
  {value: 'none', icon: 'bag-personal', labelKey: 'No luggage'},
  {value: 'small', icon: 'bag-personal', labelKey: 'Small luggage'},
  {value: 'medium', icon: 'bag-suitcase', labelKey: 'Medium luggage'},
  {value: 'large', icon: 'bag-checked', labelKey: 'Large luggage'},
];

export const PRICE_TYPES = [
  {value: 'free', icon: 'cash-off', labelKey: 'Free ride'},
  {value: 'shared_cost', icon: 'cash-multiple', labelKey: 'Shared costs'},
  {value: 'negotiable', icon: 'handshake-outline', labelKey: 'Negotiable'},
];

const findOption = (options, value, fallback) =>
  options.find(option => option.value === value) ||
  options.find(option => option.value === fallback);

export const getRidePreferenceOption = value =>
  findOption(RIDE_PREFERENCES, value, 'conversation');

export const getLuggageSizeOption = value =>
  findOption(LUGGAGE_SIZES, value, 'small');

export const getPriceTypeOption = value => findOption(PRICE_TYPES, value, 'free');

export const normalizeRoutePreferences = route => ({
  petsAllowed: route?.petsAllowed === true,
  smokingAllowed: route?.smokingAllowed === true,
  ridePreference: getRidePreferenceOption(route?.ridePreference).value,
  luggageSize: getLuggageSizeOption(route?.luggageSize).value,
  priceType: getPriceTypeOption(route?.priceType).value,
  estimatedPrice:
    route?.estimatedPrice === null || route?.estimatedPrice === undefined
      ? ''
      : String(route.estimatedPrice),
});

export const getRoutePreferenceItems = (route, t) => {
  const rideOption = getRidePreferenceOption(route?.ridePreference);
  const luggageOption = getLuggageSizeOption(route?.luggageSize);
  const priceOption = getPriceTypeOption(route?.priceType);
  const estimatedPrice = Number(route?.estimatedPrice);
  const hasEstimatedPrice = Number.isFinite(estimatedPrice) && estimatedPrice > 0;

  return [
    {
      icon: route?.petsAllowed ? 'dog' : 'dog',
      label: t('Pets'),
      value: route?.petsAllowed ? t('Allowed') : t('Not allowed'),
    },
    {
      icon: route?.smokingAllowed ? 'smoking' : 'smoking-off',
      label: t('Smoking'),
      value: route?.smokingAllowed ? t('Allowed') : t('No smoking'),
    },
    {
      icon: rideOption.icon,
      label: t('Ride vibe'),
      value: t(rideOption.labelKey),
    },
    {
      icon: luggageOption.icon,
      label: t('Max luggage'),
      value: t(luggageOption.labelKey),
    },
    {
      icon: priceOption.icon,
      label: t('Trip cost'),
      value:
        route?.priceType === 'free'
          ? t('Free ride')
          : hasEstimatedPrice
          ? `${estimatedPrice} ${t('EUR')}`
          : t(priceOption.labelKey),
    },
  ];
};

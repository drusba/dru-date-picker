'use client';

import dynamic from 'next/dynamic';

export const DruDatePicker = dynamic(
    () => import('dru-date-picker/react').then((mod) => mod.DruDatePicker),
    { ssr: false },
);

export default DruDatePicker;

import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeQRPayload } from '../lib/qr';
import type { LocalProfile } from '../types';
import type { KeyringPair } from '@polkadot/keyring/types';

interface Props {
  profile: LocalProfile;
  pair: KeyringPair;
}

export function MyQR({ profile, pair }: Props) {
  // Re-encode on each render so the timestamp stays fresh
  const qrValue = useMemo(() => encodeQRPayload(profile, pair), [profile, pair]);

  const shortAddress = `${profile.address.slice(0, 8)}…${profile.address.slice(-6)}`;

  return (
    <div className="flex flex-col items-center pt-12 px-6">
      <h2 className="text-xl font-bold text-white mb-1">
        {profile.displayName ?? 'My Drop Card'}
      </h2>
      <p className="text-xs text-gray-500 mb-6 font-mono">{shortAddress}</p>

      <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
        <QRCodeSVG value={qrValue} size={220} />
      </div>

      <div className="w-full max-w-xs bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
        {profile.sharedFields.telegram && (
          <div className="flex justify-between">
            <span className="text-gray-400">Telegram</span>
            <span className="text-white">{profile.sharedFields.telegram}</span>
          </div>
        )}
        {profile.sharedFields.email && (
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{profile.sharedFields.email}</span>
          </div>
        )}
        {profile.sharedFields.note && (
          <div className="flex justify-between">
            <span className="text-gray-400">Note</span>
            <span className="text-white">{profile.sharedFields.note}</span>
          </div>
        )}
        {!profile.sharedFields.telegram && !profile.sharedFields.email && !profile.sharedFields.note && (
          <p className="text-gray-500 text-center text-xs">No contact info shared</p>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-4 text-center">
        QR refreshes automatically. Valid for 5 minutes.
      </p>
    </div>
  );
}

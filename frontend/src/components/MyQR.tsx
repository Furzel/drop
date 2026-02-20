import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeQRPayload } from '../lib/qr';
import type { DropSigner } from '../lib/crypto';
import type { LocalProfile } from '../types';

interface Props {
  profile: LocalProfile;
  signer: DropSigner;
}

export function MyQR({ profile, signer }: Props) {
  const [qrValue, setQrValue] = useState<string>('');
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(async () => {
    setSigning(true);
    setError(null);
    try {
      const value = await encodeQRPayload(profile, signer);
      setQrValue(value);
    } catch (e) {
      setError('Could not sign QR. Make sure your extension is unlocked.');
    } finally {
      setSigning(false);
    }
  }, [profile, signer]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const shortAddress = `${profile.address.slice(0, 8)}…${profile.address.slice(-6)}`;

  return (
    <div className="flex flex-col items-center pt-12 px-6">
      <h2 className="text-xl font-bold text-white mb-1">
        {profile.displayName ?? 'My Drop Card'}
      </h2>
      <p className="text-xs text-gray-500 mb-6 font-mono">{shortAddress}</p>

      <div className="bg-white rounded-2xl p-4 shadow-lg mb-6 w-[252px] h-[252px] flex items-center justify-center">
        {signing && <p className="text-gray-400 text-sm">Signing…</p>}
        {error && <p className="text-red-400 text-xs text-center px-2">{error}</p>}
        {!signing && !error && qrValue && <QRCodeSVG value={qrValue} size={220} />}
      </div>

      {error && (
        <button onClick={generateQR} className="mb-4 text-sm text-pink-400 hover:text-pink-300">
          Retry
        </button>
      )}

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

      <p className="text-xs text-gray-600 mt-4 text-center">QR valid for 5 minutes.</p>
    </div>
  );
}

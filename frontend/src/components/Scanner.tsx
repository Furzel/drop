import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { decodeQRPayload } from '../lib/qr';
import type { QRPayload, Contact } from '../types';

interface Props {
  onSave: (contact: Contact) => void;
}

type ScanState =
  | { status: 'scanning' }
  | { status: 'preview'; payload: QRPayload }
  | { status: 'saved'; address: string }
  | { status: 'error'; message: string };

export function Scanner({ onSave }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [state, setState] = useState<ScanState>({ status: 'scanning' });

  useEffect(() => {
    if (state.status !== 'scanning') return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } } },
      videoRef.current!,
      (result, err) => {
        if (result) {
          const payload = decodeQRPayload(result.getText());
          if (!payload) {
            setState({ status: 'error', message: 'Invalid or expired QR code. Could not verify signature.' });
            return;
          }
          setState({ status: 'preview', payload });
        } else if (err && !(err instanceof NotFoundException)) {
          setState({ status: 'error', message: err.message });
        }
      }
    );

    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [state.status]);

  const handleSave = () => {
    if (state.status !== 'preview') return;
    const contact: Contact = {
      id: state.payload.address,
      address: state.payload.address,
      sharedFields: state.payload.sharedFields,
      savedAt: Date.now(),
    };
    onSave(contact);
    setState({ status: 'saved', address: state.payload.address });
  };

  if (state.status === 'preview') {
    const { payload } = state;
    const short = `${payload.address.slice(0, 8)}…${payload.address.slice(-6)}`;
    return (
      <div className="flex flex-col items-center pt-12 px-6">
        <h2 className="text-xl font-bold text-white mb-1">Save contact?</h2>
        <p className="text-xs text-gray-500 font-mono mb-6">{short}</p>
        <div className="w-full max-w-xs bg-gray-800 rounded-xl p-4 space-y-2 text-sm mb-6">
          {payload.sharedFields.telegram && (
            <div className="flex justify-between">
              <span className="text-gray-400">Telegram</span>
              <span className="text-white">{payload.sharedFields.telegram}</span>
            </div>
          )}
          {payload.sharedFields.email && (
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{payload.sharedFields.email}</span>
            </div>
          )}
          {payload.sharedFields.note && (
            <div className="flex justify-between">
              <span className="text-gray-400">Note</span>
              <span className="text-white">{payload.sharedFields.note}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          className="w-full max-w-xs bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
        >
          Save contact
        </button>
        <button
          onClick={() => setState({ status: 'scanning' })}
          className="w-full max-w-xs bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (state.status === 'saved') {
    return (
      <div className="flex flex-col items-center justify-center pt-24 px-6">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-white text-lg font-semibold mb-1">Contact saved!</p>
        <p className="text-gray-400 text-sm font-mono mb-8">
          {state.address.slice(0, 8)}…{state.address.slice(-6)}
        </p>
        <button
          onClick={() => setState({ status: 'scanning' })}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-6 rounded-xl text-sm transition-colors"
        >
          Scan another
        </button>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center pt-24 px-6">
        <p className="text-red-400 text-center mb-6">{state.message}</p>
        <button
          onClick={() => setState({ status: 'scanning' })}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-6 rounded-xl text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-8 px-6">
      <h2 className="text-xl font-bold text-white mb-4">Scan a Drop card</h2>
      <div className="relative w-full max-w-xs rounded-2xl overflow-hidden bg-black aspect-square">
        <video ref={videoRef} className="w-full h-full object-cover" />
        {/* Scanning corners overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 relative">
            <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-pink-400 rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-pink-400 rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-pink-400 rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-pink-400 rounded-br-sm" />
          </div>
        </div>
      </div>
      <p className="text-gray-500 text-sm mt-4 animate-pulse">Point camera at a Drop QR code</p>
    </div>
  );
}

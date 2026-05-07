import { useState } from 'react';
import { isAddress } from 'ethers';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import { sha256 } from 'js-sha256';

const IssueCertificate = () => {
  const { issueCertificate, isChainConfigured } = useAuth();
  const [recipient, setRecipient] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [documentHash, setDocumentHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result;
      if (buffer) {
        const hash = sha256(new Uint8Array(buffer as ArrayBuffer));
        setDocumentHash('0x' + hash);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setDocumentHash('');
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isChainConfigured) {
      setFeedback({
        type: 'error',
        message:
          'Contract address is not configured. Set VITE_CONTRACT_ADDRESS for live mode or use the guest demo at /demo.',
      });
      return;
    }

    if (!recipient.trim()) {
      setFeedback({ type: 'error', message: 'Recipient wallet address is required.' });
      return;
    }

    if (!isAddress(recipient.trim())) {
      setFeedback({ type: 'error', message: 'Enter a valid recipient Ethereum address.' });
      return;
    }

    if (!file || !documentHash) {
      setFeedback({ type: 'error', message: 'Please select a file first.' });
      return;
    }

    try {
      setIsLoading(true);
      setFeedback(null);

      const metadataURI = JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        issuedAt: new Date().toISOString(),
      });

      await issueCertificate(recipient.trim(), documentHash, metadataURI, 0);

      setFeedback({
        type: 'success',
        message:
          'Certificate issued on-chain. The document ID is derived from this hash and the recipient address — both must match when verifying.',
      });
      setFile(null);
      setDocumentHash('');
      setRecipient('');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to issue certificate',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b2a]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#1b263b] rounded-lg shadow-lg overflow-hidden border border-[#415a77]">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#f9fafb] mb-2">Issue New Certificate</h2>
            <p className="text-[#94a3b8] text-sm mb-6">
              Upload the file to certify. We store a SHA-256 hash on-chain together with the recipient address.
              The same file bytes must be hashed later to prove a match.
            </p>

            {!isChainConfigured && (
              <div className="mb-6 p-4 rounded-md bg-amber-900/25 border border-amber-600 text-amber-100 text-sm">
                Live issuance is unavailable until <span className="font-mono">VITE_CONTRACT_ADDRESS</span> is set.
                Try the bundled verifier flow on{' '}
                <Link to="/demo" className="underline text-white">
                  /demo
                </Link>
                .
              </div>
            )}

            {feedback && (
              <div
                className={`mb-6 p-4 rounded-md ${
                  feedback.type === 'success'
                    ? 'bg-green-900/30 border border-green-500 text-green-100'
                    : 'bg-red-900/30 border border-red-500 text-red-100'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Recipient wallet address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x… (student / holder)"
                  className="w-full px-3 py-2 bg-[#0d1b2a] border border-[#415a77] rounded-md text-[#f9fafb] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Document to certify</label>
                <FileUpload
                  onFileSelect={handleFileChange}
                  selectedFile={file}
                  onRemoveFile={handleRemoveFile}
                  accept=".pdf,.doc,.docx,.txt"
                />
                {documentHash && (
                  <p className="mt-2 text-xs text-[#94a3b8] break-all">
                    SHA-256 (hex): {documentHash}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!file || !recipient.trim() || isLoading || !isChainConfigured}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                    !file || !recipient.trim() || isLoading || !isChainConfigured
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-[#6366F1] hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1]'
                  }`}
                >
                  {isLoading ? 'Issuing…' : 'Issue on-chain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCertificate;

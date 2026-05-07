import { useState, useEffect } from 'react';
import { isAddress } from 'ethers';
import { useAuth } from '../context/useAuth';
import Header from '../components/Header';
import FileUpload from '../components/FileUpload';
import { sha256 } from 'js-sha256';
import { Certificate } from '../types';

const VerifyDocument = () => {
  const { currentUser, getCertificate, completeVerification } = useAuth();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [documentHash, setDocumentHash] = useState<string>('');
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (currentUser?.address && !recipientAddress) {
      setRecipientAddress(currentUser.address);
    }
  }, [currentUser?.address, recipientAddress]);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const hash = sha256(new Uint8Array(event.target.result as ArrayBuffer));
        setDocumentHash('0x' + hash);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setDocumentHash('');
    setCertificate(null);
    setFeedback(null);
  };

  const handleCheckDocument = async () => {
    if (!documentHash) {
      setFeedback({ type: 'error', message: 'Please select a document first.' });
      return;
    }
    if (!recipientAddress.trim() || !isAddress(recipientAddress.trim())) {
      setFeedback({ type: 'error', message: 'Enter the recipient wallet address used when the document was issued.' });
      return;
    }

    try {
      setIsLoading(true);
      setFeedback(null);

      const cert = await getCertificate(documentHash, recipientAddress.trim());
      setCertificate(cert);

      if (cert) {
        const onChainHash = cert.hash ?? cert.documentHash;
        const match = onChainHash?.toLowerCase() === documentHash.toLowerCase();
        setFeedback({
          type: match ? 'info' : 'error',
          message: match
            ? `On-chain record found. Status: ${cert.status ?? 'unknown'}.`
            : 'Hash mismatch — this file does not match the certified hash.',
        });
      } else {
        setFeedback({
          type: 'error',
          message:
            'No on-chain certificate for this hash and recipient. Confirm the institution issued it for this wallet.',
        });
      }
    } catch (error) {
      console.error('Error checking document:', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to check document',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDocument = async (isVerified: boolean) => {
    if (!certificate?.pendingRequestId) {
      setFeedback({
        type: 'error',
        message:
          'There is no open verification request assigned to your wallet for this document. The recipient must request verification first.',
      });
      return;
    }

    if (!currentUser?.isVerifier) {
      setFeedback({ type: 'error', message: 'Only the assigned verifier wallet can complete verification.' });
      return;
    }

    try {
      setIsVerifying(true);
      await completeVerification(certificate.pendingRequestId, isVerified, verificationNotes);

      setCertificate({
        ...certificate,
        status: isVerified ? 'verified' : 'rejected',
        verificationNotes,
        pendingRequestId: undefined,
      });

      setFeedback({
        type: 'success',
        message: `Verification recorded on-chain (${isVerified ? 'approved' : 'rejected'}).`,
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to verify document',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const displayName = certificate?.fileName ?? certificate?.documentHash ?? 'Document';
  const canVerifierAct =
    Boolean(currentUser?.isVerifier && certificate?.pendingRequestId && certificate.status === 'pending');

  return (
    <div className="min-h-screen bg-[#0d1b2a]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#1b263b] rounded-lg shadow-lg overflow-hidden border border-[#415a77]">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#f9fafb] mb-2">Verify document (hash match)</h2>
            <p className="text-[#94a3b8] text-sm mb-6">
              Upload the same file that was certified. We compute SHA-256 and look up the on-chain record for that hash
              and the recipient address.
            </p>

            {feedback && (
              <div
                className={`mb-6 p-4 rounded-md ${
                  feedback.type === 'success'
                    ? 'bg-green-900/30 border border-green-500 text-green-100'
                    : feedback.type === 'error'
                      ? 'bg-red-900/30 border border-red-500 text-red-100'
                      : 'bg-blue-900/30 border border-blue-500 text-blue-100'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Recipient address (certificate holder)
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x…"
                  className="w-full px-3 py-2 bg-[#0d1b2a] border border-[#415a77] rounded-md text-[#f9fafb] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Document file</label>
                <FileUpload
                  onFileSelect={handleFileChange}
                  selectedFile={selectedFile}
                  onRemoveFile={handleRemoveFile}
                  accept=".pdf,.doc,.docx,.txt"
                />
                {documentHash && (
                  <p className="mt-2 text-xs text-[#94a3b8] break-all">Computed SHA-256: {documentHash}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCheckDocument}
                  disabled={!documentHash || isLoading}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                    !documentHash || isLoading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-[#6366F1] hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1]'
                  }`}
                >
                  {isLoading ? 'Checking…' : 'Check on-chain'}
                </button>
              </div>

              {certificate && (
                <div className="mt-6 p-4 bg-[#0d1b2a] rounded-md border border-[#415a77]">
                  <h3 className="text-lg font-medium text-[#f9fafb] mb-2">Certificate</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#94a3b8]">Document</p>
                      <p className="text-[#f9fafb]">{displayName}</p>
                    </div>
                    <div>
                      <p className="text-[#94a3b8]">Status</p>
                      <p
                        className={`font-medium ${
                          certificate.status === 'verified'
                            ? 'text-green-400'
                            : certificate.status === 'rejected'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                        }`}
                      >
                        {(certificate.status ?? 'pending').charAt(0).toUpperCase() +
                          (certificate.status ?? 'pending').slice(1)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[#94a3b8]">Stored hash</p>
                      <p className="text-[#f9fafb] break-all font-mono text-xs">{certificate.documentHash}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[#94a3b8]">Issuer</p>
                      <p className="text-[#f9fafb] break-all">{certificate.institutionAddress}</p>
                    </div>
                    {certificate.verificationNotes && (
                      <div className="col-span-2">
                        <p className="text-[#94a3b8]">Notes</p>
                        <p className="text-[#f9fafb] whitespace-pre-wrap">{certificate.verificationNotes}</p>
                      </div>
                    )}
                  </div>

                  {!currentUser?.isVerifier && certificate.status === 'pending' && (
                    <p className="mt-4 text-sm text-[#94a3b8]">
                      If you are the recipient, request verification from your verifier from the home page. Verifiers
                      complete the review here once a request exists.
                    </p>
                  )}

                  {currentUser?.isVerifier && certificate.status === 'pending' && !certificate.pendingRequestId && (
                    <p className="mt-4 text-sm text-[#f97316]">
                      No pending verification request for your wallet on this document yet.
                    </p>
                  )}

                  {canVerifierAct && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="verificationNotes" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                          Verification notes (optional)
                        </label>
                        <textarea
                          id="verificationNotes"
                          rows={3}
                          className="w-full px-3 py-2 bg-[#0d1b2a] border border-[#415a77] rounded-md text-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Add notes…"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(false)}
                          disabled={isVerifying}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {isVerifying ? 'Working…' : 'Reject'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(true)}
                          disabled={isVerifying}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {isVerifying ? 'Working…' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyDocument;

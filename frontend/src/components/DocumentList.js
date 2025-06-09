import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import backendService from '../services/backendService';
import { toast } from 'react-toastify';

const DocumentList = ({ refreshTrigger, onDocumentSelect }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifyingDoc, setVerifyingDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { currentUser, identity } = useAuth();

  useEffect(() => {
    if (currentUser && identity) {
      fetchDocuments();
    }
  }, [currentUser, identity, refreshTrigger]);

  const fetchDocuments = async () => {
    if (!currentUser || !identity) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const service = backendService(process.env.REACT_APP_CANISTER_ID, {
        agentOptions: { identity }
      });
      
      let result;
      if (currentUser.role === 'verifier') {
        result = await service.getUncheckedDocuments();
      } else {
        result = await service.listDocuments(currentUser.email);
      }
      
      if (result?.Ok) {
        // Transform the data to match our UI needs
        const docs = result.Ok.map(doc => ({
          ...doc,
          id: doc.id.toString(),
          uploadDate: new Date(Number(doc.uploadedAt) / 1000000), // Convert from nanoseconds to milliseconds
          status: doc.status?.toLowerCase() || 'pending',
          fileSize: doc.size || 0,
          fileType: doc.fileType || 'application/octet-stream'
        }));
        
        setDocuments(docs);
      } else {
        throw new Error(result?.Err || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to load documents');
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (docId, status = 'verified') => {
    if (!currentUser || !identity) {
      toast.error('You must be logged in to verify documents');
      return;
    }
    
    try {
      setVerifyingDoc(docId);
      
      const service = backendService(process.env.REACT_APP_CANISTER_ID, {
        agentOptions: { identity }
      });
      
      const result = await service.verifyDocument(
        docId,
        currentUser.email,
        status,
        status === 'verified' ? 'Document verified' : 'Document rejected'
      );
      
      if (result?.Ok) {
        toast.success(`Document ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
        fetchDocuments();
      } else {
        throw new Error(result?.Err || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification failed:', err);
      toast.error(err.message || 'Failed to update document status');
    } finally {
      setVerifyingDoc(null);
    }
  };

  const handleDownload = async (docId, fileName) => {
    if (!currentUser || !identity) {
      toast.error('You must be logged in to download documents');
      return;
    }
    
    try {
      const service = backendService(process.env.REACT_APP_CANISTER_ID, {
        agentOptions: { identity }
      });
      
      const result = await service.downloadFile(docId);
      
      if (result?.Ok) {
        const fileContent = new Uint8Array(result.Ok);
        const blob = new Blob([fileContent]);
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || `document-${docId}`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        throw new Error(result?.Err || 'Download failed');
      }
    } catch (err) {
      console.error('Download failed:', err);
      toast.error(err.message || 'Failed to download document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.metadata?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || statusFilter !== 'all' 
            ? 'No matching documents found.' 
            : 'No documents available. Upload a document to get started.'}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr 
                  key={doc.id} 
                  className={`hover:bg-gray-50 ${onDocumentSelect ? 'cursor-pointer' : ''}`}
                  onClick={() => onDocumentSelect && onDocumentSelect(doc)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-md">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{doc.fileName || 'Untitled Document'}</div>
                        <div className="text-sm text-gray-500">
                          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : 'Size unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doc.status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : doc.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1) || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.uploadDate?.toLocaleDateString() || 'N/A'}
                    {doc.uploadDate && (
                      <div className="text-xs text-gray-400">
                        {doc.uploadDate.toLocaleTimeString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(doc.id, doc.fileName);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      
                      {currentUser.role === 'verifier' && doc.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerify(doc.id, 'verified');
                            }}
                            disabled={verifyingDoc === doc.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Verify"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerify(doc.id, 'rejected');
                            }}
                            disabled={verifyingDoc === doc.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Reject"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentList; 
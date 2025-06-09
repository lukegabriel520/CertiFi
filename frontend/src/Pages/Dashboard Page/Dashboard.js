import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateMockHash = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8);
};

const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const CheckIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
    width="1em"
    height="1em"
  >
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </svg>
);

const ClockIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
    width="1em"
    height="1em"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13H11v6l5.25 3.15.75-1.23-4.5-2.7V7h-.5z" />
  </svg>
);

const SimpleCircularVerifiedIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
    width="1em"
    height="1em"
  >
    <circle cx="12" cy="12" r="10" />
    <path
      d="M16.3396 8.32982L10.4096 14.2598L7.65961 11.5098L6.59961 12.5698L10.4096 16.3798L17.3996 9.38982L16.3396 8.32982Z"
      fill="black"
    />
  </svg>
);

const InstitutionIcon = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 384 512" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M48 0C21.5 0 0 21.5 0 48L0 464c0 26.5 21.5 48 48 48l96 0 0-80c0-26.5 21.5-48 48-48s48 21.5 48 48l0 80 96 0c26.5 0 48-21.5 48-48l0-416c0-26.5-21.5-48-48-48L48 0zM64 240c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zm112-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zm80 16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zM80 96l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16zm80 16c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32zM272 96l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16z" />
  </svg>
);

const UserIcon = ({ className, ...props }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const UploadIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
    width="1em"
    height="1em"
  >
    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
  </svg>
);

const InsertFileIcon = ({ className, ...props }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const DiscardIcon = ({ className, ...props }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const DownloadModal = ({ isOpen, onClose, documentName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Download Document</h3>
        <p className="modal-text">
          Downloading: <span className="modal-document-name"><i className="fa-solid fa-file-pdf" style={{ marginRight: '0.5rem', color: '#e53e3e' }}></i>{documentName}.pdf</span>
        </p>
        <div className="modal-actions">
          <button onClick={onClose} className="modal-close-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onRedo, onConfirm, message, isError, isFinalUserUploadConfirmation, userType }) => {
  useEffect(() => {
    let timer;
    if (isOpen && !isError && message.includes("successfully") && !isFinalUserUploadConfirmation) {
      timer = setTimeout(() => {
        onClose();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isOpen, message, onClose, isFinalUserUploadConfirmation, isError]);

  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-content">
        <p className="confirmation-modal-text">
          <span style={{ fontWeight: 'bold' }}>Result:</span> {isError ? 'Error' : (isFinalUserUploadConfirmation ? 'Confirmation' : 'Verified')}
        </p>
        <p className="confirmation-modal-text">
          {message}
        </p>
        <div className="confirmation-modal-actions">
          {isFinalUserUploadConfirmation ? (
            <>
              <button onClick={onRedo} className="confirmation-modal-button-redo">
                Cancel
              </button>
              <button onClick={onConfirm} className="confirmation-modal-button-confirm">
                OK
              </button>
            </>
          ) : (
            <>
              {userType === 'verifier' && !isError && !message.includes("successfully verified") && (
                <>
                  <button onClick={onRedo} className="confirmation-modal-button-redo">
                    Redo
                  </button>
                  <button onClick={onConfirm} className="confirmation-modal-button-confirm">
                    Confirm
                  </button>
                </>
              )}
              {(isError || message.includes("successfully verified") || message.includes("successfully added")) && (
                <button onClick={onClose} className="modal-close-button" style={{ marginLeft: 'auto' }}>
                  OK
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const UploadDetailsModal = ({ isOpen, onClose, onSubmit, uploadedFileName, onRedoUpload }) => {
  const [docName, setDocName] = useState(uploadedFileName || '');
  const [issuer, setIssuer] = useState('');
  const [owner, setOwner] = useState('');
  const [touched, setTouched] = useState({ issuer: false, owner: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setDocName(uploadedFileName || '');
    setIssuer('');
    setOwner('');
    setTouched({ issuer: false, owner: false });
    setSubmitAttempted(false);
  }, [uploadedFileName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!issuer.trim() || !owner.trim()) return;
    onSubmit({ docName, issuer, owner });
  };

  const showError = (touched.issuer || touched.owner || submitAttempted) && (!issuer.trim() || !owner.trim());

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Enter Document Details</h3>
        <div className="modal-input-group">
          <label htmlFor="docName">Document Name:</label>
          <input
            id="docName"
            type="text"
            className="modal-input"
            value={docName}
            readOnly
            placeholder="e.g., My Certificate.pdf"
          />
        </div>
        <div className="modal-input-group">
          <label htmlFor="issuer">Issuer:</label>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-building" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#60a5fa', fontSize: '1.1rem', pointerEvents: 'none' }}></i>
            <input
              id="issuer"
              type="text"
              className="modal-input"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, issuer: true }))}
              placeholder="e.g., Certifying Authority Inc."
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
        <div className="modal-input-group">
          <label htmlFor="owner">Verifier:</label>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-user-check" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#60a5fa', fontSize: '1.1rem', pointerEvents: 'none' }}></i>
            <input
              id="owner"
              type="text"
              className="modal-input"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, owner: true }))}
              placeholder="e.g., Your Name"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
        {showError && (
          <div style={{ color: '#dc3545', marginBottom: '1rem', fontSize: '0.95rem' }}>
            Need input in the verifier and institution
          </div>
        )}
        <div className="modal-actions">
          <button onClick={onRedoUpload} className="confirmation-modal-button-redo">Redo</button>
          <button onClick={handleSubmit} className="confirmation-modal-button-confirm" disabled={!issuer.trim() || !owner.trim()}>Submit</button>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [activeLink, setActiveLink] = useState('/dashboard');

  const isVerifier = currentUser && currentUser.role === 'verifier';

  const handleNavLinkClick = async (path) => {
    setActiveLink(path);
    if (path === '/') {
      navigate('/');
    } else if (path === '/dashboard') {
      if (currentUser) {
        navigate(`/dashboard/${currentUser.role}`);
      } else {
        navigate('/login');
      }
    } else if (path === '/how-it-works') {
      if (!isVerifier) navigate('/', { state: { scrollTo: 'how-it-works-section' } });
    } else if (path === '/faq') {
      if (!isVerifier) navigate('/', { state: { scrollTo: 'faq-section' } });
    } else if (path === '/contact-us') {
      if (!isVerifier) navigate('/', { state: { scrollTo: 'contact-us-section' } });
    } else if (path === '/logout') {
      await logout();
      navigate('/');
    }
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <a href="/" className="logo-link" onClick={(e) => { e.preventDefault(); handleNavLinkClick('/'); }}>
          <img src="/CertiFi_Logo.png" alt="CertiFi Logo" className="logo-image" />
          <p className="logo-text">CertiFi</p>
        </a>
      </div>
      <div className="nav-links">
        {currentUser && (
          <a
            href="#"
            className={`nav-link ${activeLink === '/dashboard' ? 'nav-link-active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleNavLinkClick('/dashboard'); }}
          >
            Dashboard
          </a>
        )}
        {!isVerifier && (
          <>
            <a
              href="#"
              className={`nav-link ${activeLink === '/how-it-works' ? 'nav-link-active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNavLinkClick('/how-it-works'); }}
            >
              How it works
            </a>
            <a
              href="#"
              className={`nav-link ${activeLink === '/faq' ? 'nav-link-active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNavLinkClick('/faq'); }}
            >
              FAQ
            </a>
            <a
              href="#"
              className={`nav-link ${activeLink === '/contact-us' ? 'nav-link-active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNavLinkClick('/contact-us'); }}
            >
              Contact Us
            </a>
          </>
        )}
        {currentUser && (
          <a href="#" className="nav-link nav-link-logout" onClick={(e) => { e.preventDefault(); handleNavLinkClick('/logout'); }}>
            Logout
          </a>
        )}
      </div>
    </nav>
  );
};

const api = {
  fetchDocuments: async (userType) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real application, you would fetch data from your backend
    // This is hardcoded for demonstration purposes, replace with actual backend integration
    if (userType === 'user') {
      return JSON.parse(localStorage.getItem('userDocuments')) || [];
    } else if (userType === 'institution') {
      return JSON.parse(localStorage.getItem('institutionDocuments')) || [];
    } else if (userType === 'verifier') {
      return JSON.parse(localStorage.getItem('verifierPendingDocuments')) || [];
    }
    return [];
  },
  uploadDocument: async (file, userType, docDetails = null) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    let newDocument;
    if (userType === 'institution') {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const fileHash = arrayBufferToHex(hashBuffer);
      newDocument = {
        id: `inst-doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        date: getTodayDate(),
        hash: fileHash,
        fileObject: file, // In a real app, this would be a URL or identifier to the stored file
      };
      const existingDocs = JSON.parse(localStorage.getItem('institutionDocuments')) || [];
      localStorage.setItem('institutionDocuments', JSON.stringify([newDocument, ...existingDocs]));
    } else if (userType === 'user' && docDetails) {
      newDocument = {
        id: `user-doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: docDetails.docName,
        date: getTodayDate(),
        status: 'Pending',
        issuer: docDetails.issuer,
        verifier: docDetails.owner,
        fileObject: file, // In a real app, this would be a URL or identifier to the stored file
      };
      const existingDocs = JSON.parse(localStorage.getItem('userDocuments')) || [];
      localStorage.setItem('userDocuments', JSON.stringify([newDocument, ...existingDocs]));
    } else if (userType === 'verifier') {
      // For verifier, simulate matching and setting status
      const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('').toLowerCase();
      let targetDoc = null;
      let documentsToVerify = JSON.parse(localStorage.getItem('verifierPendingDocuments')) || [];

      if (fileNameWithoutExtension === 'heat') {
        targetDoc = documentsToVerify.find(doc =>
          doc.name === 'Academic Transcript' && doc.status === 'Pending'
        );
      } else if (fileNameWithoutExtension === 'pacers') {
        targetDoc = documentsToVerify.find(doc =>
          doc.name === 'Professional Certification' && doc.status === 'Pending'
        );
      } else if (fileNameWithoutExtension === 'my-college-degree-simulated') {
        targetDoc = documentsToVerify.find(doc =>
          doc.name === 'My College Degree' && doc.status === 'Pending'
        );
      }

      if (targetDoc) {
        // Simulating the document as being verified and moving it
        const verifiedDoc = { ...targetDoc, status: 'Valid', verifier: 'Current Verifier', hash: generateMockHash(file.name)}; // Add mock hash for verifier
        const checkedDocs = JSON.parse(localStorage.getItem('verifierCheckedDocuments')) || [];
        localStorage.setItem('verifierCheckedDocuments', JSON.stringify([verifiedDoc, ...checkedDocs]));
        localStorage.setItem('verifierPendingDocuments', JSON.stringify(documentsToVerify.filter(doc => doc.id !== targetDoc.id)));
        return { success: true, message: `Document "${file.name}" verified.`, docId: targetDoc.id, docName: targetDoc.name };
      } else {
        return { success: false, message: `"${file.name}" does not match any document awaiting verification.`, docId: null, docName: file.name };
      }
    }
    return newDocument;
  },
  updateDocumentStatus: async (docId, status, userType) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (userType === 'user') {
      const userDocs = JSON.parse(localStorage.getItem('userDocuments')) || [];
      const updatedDocs = userDocs.map(doc =>
        doc.id === docId ? { ...doc, status: status, verifier: 'Current Verifier' } : doc
      );
      localStorage.setItem('userDocuments', JSON.stringify(updatedDocs));
    } else if (userType === 'verifier') {
        let pending = JSON.parse(localStorage.getItem('verifierPendingDocuments')) || [];
        let checked = JSON.parse(localStorage.getItem('verifierCheckedDocuments')) || [];
        let docToMove = pending.find(d => d.id === docId) || checked.find(d => d.id === docId);

        if (docToMove) {
            if (status === 'Valid') {
                pending = pending.filter(doc => doc.id !== docId);
                checked = [{ ...docToMove, status: 'Valid' }, ...checked];
            } else if (status === 'Pending') {
                checked = checked.filter(doc => doc.id !== docId);
                pending = [{ ...docToMove, status: 'Pending' }, ...pending];
            }
            localStorage.setItem('verifierPendingDocuments', JSON.stringify(pending));
            localStorage.setItem('verifierCheckedDocuments', JSON.stringify(checked));
        }
    }
  },
  deleteDocument: async (documentId, userType) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (userType === 'institution') {
      const institutionDocs = JSON.parse(localStorage.getItem('institutionDocuments')) || [];
      const updatedDocs = institutionDocs.filter(doc => doc.id !== documentId);
      localStorage.setItem('institutionDocuments', JSON.stringify(updatedDocs));
    }
  },
};

export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if user's role matches the URL role
    if (currentUser.role !== role) {
      // Redirect to the correct role-specific dashboard
      navigate(`/dashboard/${currentUser.role}`);
    }
  }, [currentUser, role, navigate]);

  // Set userType based on currentUser's role
  const [userType, setUserType] = useState(currentUser?.role || 'institution');

  useEffect(() => {
    if (currentUser) {
      setUserType(currentUser.role);
    }
  }, [currentUser]);

  const [documents, setDocuments] = useState([]);
  const [checkedDocuments, setCheckedDocuments] = useState([]);
  const [institutionDocuments, setInstitutionDocuments] = useState([]);

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedDocumentName, setSelectedDocumentName] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [isConfirmationError, setIsConfirmationError] = useState(false);
  const fileInputRef = useRef(null);
  const [documentToVerifyId, setDocumentToVerifyId] = useState(null);
  const [showCheckedDocuments, setShowCheckedDocuments] = useState(false);

  const [isUploadDetailsModalOpen, setIsUploadDetailsModalOpen] = useState(false);
  const [currentUploadedFile, setCurrentUploadedFile] = useState(null);
  const [uploadedFileNameForModal, setUploadedFileNameForModal] = useState('');
  const [stagedUserDocument, setStagedUserDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [expandedHashes, setExpandedHashes] = useState({});

  const [showUploadDetailsModal, setShowUploadDetailsModal] = useState(false);
  const [confirmationError, setConfirmationError] = useState(false);

  const toggleHashDisplay = (docId) => {
    setExpandedHashes(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const filteredDocuments = useMemo(() => {
    let currentDocuments = [];
    if (userType === 'verifier') {
      currentDocuments = showCheckedDocuments ? checkedDocuments : documents;
    } else {
      currentDocuments = documents;
    }

    return currentDocuments.filter(doc => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = (userType === 'user' && (
        doc.name.toLowerCase().includes(searchTermLower) ||
        (doc.issuer && doc.issuer.toLowerCase().includes(searchTermLower)) ||
        (doc.verifier && doc.verifier.toLowerCase().includes(searchTermLower))
      )) ||
      (userType === 'institution' && (
        doc.name.toLowerCase().includes(searchTermLower) ||
        (doc.hash && doc.hash.toLowerCase().includes(searchTermLower))
      )) ||
      (userType === 'verifier' && (
        doc.name.toLowerCase().includes(searchTermLower) ||
        (doc.issuer && doc.issuer.toLowerCase().includes(searchTermLower)) ||
        (doc.owner && doc.owner.toLowerCase().includes(searchTermLower)) ||
        (doc.hash && doc.hash.toLowerCase().includes(searchTermLower))
      ));
      const matchesStatus = filterStatus === 'All' || doc.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [documents, checkedDocuments, searchTerm, filterStatus, userType, showCheckedDocuments]);

  const handleDocumentClick = (doc) => {
    setSelectedDocumentName(doc.name);
    setIsDownloadModalOpen(true);

    setTimeout(() => {
      if (doc.fileObject) {
        const url = URL.createObjectURL(doc.fileObject);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileObject.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        let simulatedFileName = '';
        const fileContent = `Simulated content for ${doc.name} with hash ${doc.hash || 'N/A'}. This is a dummy PDF.`;

        if (doc.name === 'Academic Transcript') {
          simulatedFileName = 'academic-transcript-simulated.pdf';
        } else if (doc.name === 'Professional Certification') {
          simulatedFileName = 'professional-certification-simulated.pdf';
        } else if (doc.name === 'My College Degree') {
          simulatedFileName = 'my-college-degree-simulated.pdf';
        } else if (doc.name === 'Driving License') {
          simulatedFileName = 'driving-license-simulated.pdf';
        } else {
          simulatedFileName = `${doc.name.toLowerCase().replace(/\s+/g, '-')}-simulated.pdf`;
        }

        const blob = new Blob([fileContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = simulatedFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 100);
  };

  const closeDownloadModal = () => {
    setIsDownloadModalOpen(false);
    setSelectedDocumentName('');
  };

  const handleFileActionClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setIsLoading(true);

      if (userType === 'institution') {
        const newDocuments = [];
        for (const file of Array.from(files)) {
          try {
            const uploadedDoc = await api.uploadDocument(file, 'institution');
            newDocuments.push(uploadedDoc);
          } catch (err) {
            console.error('Error uploading document:', err);
            setConfirmationMessage(`Failed to upload "${file.name}". Please try again.`);
            setIsConfirmationError(true);
            setShowConfirmationModal(true);
            setIsLoading(false);
            return;
          }
        }
        setDocuments(prevDocs => [...newDocuments, ...prevDocs]);
        setConfirmationMessage(`Successfully uploaded ${newDocuments.length} document(s).`);
        setIsConfirmationError(false);
        setShowConfirmationModal(true);
      } else if (userType === 'user') {
        const file = files[0];
        setCurrentUploadedFile(file);
        setUploadedFileNameForModal(file.name);
        setIsUploadDetailsModalOpen(true);
      } else {
        const file = files[0];
        try {
          const result = await api.uploadDocument(file, 'verifier');
          if (result.success) {
            setConfirmationMessage(result.message);
            setIsConfirmationError(false);
            setDocumentToVerifyId(result.docId);
            const pending = await api.fetchDocuments('verifier');
            const checked = JSON.parse(localStorage.getItem('verifierCheckedDocuments')) || [];
            setDocuments(pending);
            setCheckedDocuments(checked);
          } else {
            setConfirmationMessage(result.message);
            setIsConfirmationError(true);
            setDocumentToVerifyId(null);
          }
          setShowConfirmationModal(true);
        } catch (err) {
          console.error('Error processing verifier upload:', err);
          setConfirmationMessage(`Failed to process "${file.name}". Please try again.`);
          setIsConfirmationError(true);
          setShowConfirmationModal(true);
        }
      }
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddUserDocumentSubmit = async ({ docName, issuer, owner }) => {
    if (currentUploadedFile) {
      try {
        const newDocument = await api.uploadDocument(currentUploadedFile, 'user', { docName, issuer, owner });
        setStagedUserDocument(newDocument);
        setConfirmationMessage(`Add "${docName}" to your dashboard?`);
        setIsConfirmationError(false);
        setShowConfirmationModal(true);
        setIsUploadDetailsModalOpen(false);
      } catch (error) {
        console.error('Error adding user document:', error);
        setConfirmationMessage('Failed to add document. Please try again.');
        setIsConfirmationError(true);
        setShowConfirmationModal(true);
      }
    }
  };

  const closeUploadDetailsModal = () => {
    setIsUploadDetailsModalOpen(false);
    setCurrentUploadedFile(null);
    setUploadedFileNameForModal('');
    setStagedUserDocument(null);
  };

  const handleRedoUploadForUser = () => {
    closeUploadDetailsModal();
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
    setShowConfirmationModal(false);
  };

  const handleRedo = () => {
    setShowConfirmationModal(false);
    setConfirmationMessage('');
    setIsConfirmationError(false);
    setDocumentToVerifyId(null);
    setStagedUserDocument(null);
    if (userType === 'verifier') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      if (stagedUserDocument && userType === 'user') {
        await api.updateDocumentStatus(stagedUserDocument.id, 'Pending', userType);
        setDocuments(prevDocs => [stagedUserDocument, ...prevDocs]);
        setStagedUserDocument(null);
        closeConfirmationModal();
      } else if (documentToVerifyId) {
        const docToVerify = [...documents, ...checkedDocuments].find(d => d.id === documentToVerifyId);
        if (docToVerify) {
          await api.updateDocumentStatus(documentToVerifyId, 'Valid', userType);
          setConfirmationMessage(`Document "${docToVerify.name}" has been successfully verified and its status updated to Valid.`);
          setIsConfirmationError(false);
          setShowConfirmationModal(true);

          const pending = await api.fetchDocuments('verifier');
          const checked = JSON.parse(localStorage.getItem('verifierCheckedDocuments')) || [];
          setDocuments(pending);
          setCheckedDocuments(checked);

        } else {
          setConfirmationMessage("Error: Document to confirm not found.");
          setIsConfirmationError(true);
          setShowConfirmationModal(true);
        }
      }
    } catch (error) {
      console.error('Error confirming document:', error);
      setConfirmationMessage('Failed to confirm document. Please try again.');
      setIsConfirmationError(true);
      setShowConfirmationModal(true);
    } finally {
      setIsLoading(false);
      setDocumentToVerifyId(null);
    }
  };

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false);
    setConfirmationMessage('');
    setIsConfirmationError(false);
    setDocumentToVerifyId(null);
    setStagedUserDocument(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDiscardDocument = async (documentId) => {
    if (userType === 'institution') {
      try {
        await api.deleteDocument(documentId, 'institution');
        setDocuments(prevDocuments =>
          prevDocuments.filter(doc => doc.id !== documentId)
        );
      } catch (error) {
        console.error('Error discarding document:', error);
        setConfirmationMessage('Failed to discard document. Please try again.');
        setIsConfirmationError(true);
        setShowConfirmationModal(true);
      }
    }
  };

  const getHeaderInfo = () => {
    switch (userType) {
      case 'user':
        return { text: 'User', icon: <UserIcon className="verifier-icon" /> };
      case 'institution':
        return { text: 'Institution', icon: <InstitutionIcon className="verifier-icon" /> };
      case 'verifier':
        return { text: 'Verifier', icon: <SimpleCircularVerifiedIcon className="verifier-icon" /> };
      default:
        return { text: 'Guest', icon: <UserIcon className="verifier-icon" /> };
    }
  };

  const { text: headerText, icon: headerIcon } = getHeaderInfo();

  useEffect(() => {
    if (
      showConfirmationModal &&
      !isConfirmationError &&
      confirmationMessage &&
      userType === 'institution' &&
      confirmationMessage.toLowerCase().includes('successfully uploaded')
    ) {
      const timer = setTimeout(() => {
        setShowConfirmationModal(false);
        setConfirmationMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmationModal, isConfirmationError, confirmationMessage, userType]);

  useEffect(() => {
    const fetchInitialDocuments = async () => {
      setIsLoading(true);
      try {
        let fetchedDocs = [];
        if (userType === 'verifier') {
          const pending = await api.fetchDocuments('verifier');
          const checked = JSON.parse(localStorage.getItem('verifierCheckedDocuments')) || [];
          setDocuments(pending);
          setCheckedDocuments(checked);
        } else {
          fetchedDocs = await api.fetchDocuments(userType);
          setDocuments(fetchedDocs);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        setConfirmationMessage('Failed to load documents. Please try again.');
        setIsConfirmationError(true);
        setShowConfirmationModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialDocuments();
  }, [userType]);

  return (
    <div className="main-container-wrapper" style={{ position: 'relative' }}>
      <div className="main-container">
        <Navbar />
        <div className="verifier-header-sticky">
          <div className="verifier-header">
            {headerIcon}
            <span className="verifier-text">{headerText}</span>
          </div>
        </div>
        <main className="main-content">
          <div className="dashboard-section-wrapper">
            {userType === 'verifier' && (
              <div className="verifier-toggle-container">
                <button className="unchecked-button" onClick={() => setShowCheckedDocuments(prev => !prev)}>
                  {showCheckedDocuments ? (
                    <ClockIcon className="clock-icon-color" />
                  ) : (
                    <CheckIcon className="green-check-icon" />
                  )}
                  <span>{showCheckedDocuments ? "Unchecked Documents" : "Checked Documents"}</span>
                </button>
              </div>
            )}
            <section className="document-history-section">
              <div className="section-header-container">
                <h2 className="section-header">
                  {userType === 'user'
                    ? "My Documents"
                    : userType === 'institution'
                      ? "Institution Dashboard"
                      : showCheckedDocuments
                        ? "Checked Documents Dashboard"
                        : "Unchecked Documents Dashboard"}
                </h2>

                {userType === 'user' && (
                  <button className="insert-file-button" onClick={handleFileActionClick}>
                    <UploadIcon className="insert-file-icon" />
                    <span>Upload Document</span>
                  </button>
                )}

                {userType === 'institution' && (
                  <button
                    className="insert-file-button"
                    onClick={handleFileActionClick}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <InsertFileIcon className="insert-file-icon" />
                        <span>Insert File</span>
                      </>
                    )}
                  </button>
                )}

                {userType === 'verifier' && !showCheckedDocuments && (
                  <button className="insert-file-button" onClick={handleFileActionClick}>
                    <InsertFileIcon className="insert-file-icon" />
                    <span>Insert File</span>
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".pdf"
                  multiple={userType === 'institution'}
                  key={`file-input-${userType}`}
                />

              </div>

              <div className="filter-search-container">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder={userType === 'user' ? "Search by name, issuer, or verifier..." : (userType === 'institution' ? "Search by name or hash..." : "Search by name, issuer, owner, or hash...")}
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {(userType === 'user' || userType === 'verifier') && (
                  <div className="filter-select-wrapper">
                    <select
                      className="filter-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Valid">Valid</option>
                      <option value="Pending">Pending</option>
                      <option value="Invalid">Invalid</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="table-container">
                <table className="history-table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Document Name</th>
                      {(userType === 'institution' || userType === 'verifier') && <th className="table-header-cell">Hash</th>}
                      <th className="table-header-cell">Date</th>
                      {userType !== 'institution' && <th className="table-header-cell">Status</th>}
                      {userType === 'user' && <th className="table-header-cell">Issuer</th>}
                      {userType === 'user' && <th className="table-header-cell">Verifier</th>}
                      {userType === 'verifier' && (
                        <>
                          <th className="table-header-cell">Issuer</th>
                          <th className="table-header-cell">Owner</th>
                        </>
                      )}
                      {userType === 'institution' && <th className="table-header-cell table-header-cell-action"></th>}
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc, index) => (
                        <tr key={doc.id} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                          <td className="table-cell">
                            <span
                              className="document-name-link"
                              onClick={() => handleDocumentClick(doc)}
                              role="button"
                              tabIndex={0}
                              onKeyPress={(e) => e.key === 'Enter' && handleDocumentClick(doc)}
                            >
                              {doc.name}
                            </span>
                          </td>
                          {(userType === 'institution' || userType === 'verifier') && (
                            <td className="table-cell">
                              <span className="hash-text">
                                {doc.hash.length > 20 ? (
                                  <>
                                    {expandedHashes[doc.id] ? doc.hash : `${doc.hash.substring(0, 10)}...${doc.hash.substring(doc.hash.length - 10)}`}
                                    <button
                                      className="toggle-hash-display-arrow"
                                      onClick={() => toggleHashDisplay(doc.id)}
                                      title={expandedHashes[doc.id] ? "Shorten Hash" : "Extend Hash"}
                                    >
                                      {expandedHashes[doc.id] ? '«' : '»'}
                                    </button>
                                  </>
                                ) : doc.hash}
                              </span>
                            </td>
                          )}
                          <td className="table-cell">{doc.date}</td>
                          {userType !== 'institution' && (
                            <td className="table-cell">
                              <span
                                className={`status-badge ${
                                  doc.status === 'Valid' ? 'status-valid' :
                                  doc.status === 'Pending' ? 'status-pending' :
                                  'status-invalid'
                                }`}
                              >
                                {doc.status}
                              </span>
                            </td>
                          )}
                          {userType === 'user' && <td className="table-cell">{doc.issuer}</td>}
                          {userType === 'user' && <td className="table-cell">{doc.verifier}</td>}
                          {userType === 'verifier' && (
                            <>
                              <td className="table-cell">{doc.issuer}</td>
                              <td className="table-cell">{doc.owner}</td>
                            </>
                          )}
                          {userType === 'institution' && (
                            <td className="table-cell table-cell-action">
                              <button
                                className="discard-button"
                                onClick={() => handleDiscardDocument(doc.id)}
                                aria-label={`Discard document ${doc.name}`}
                              >
                                <DiscardIcon />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={userType === 'institution' ? "4" : userType === 'user' ? "5" : "6"} className="no-documents-message">No documents found matching your criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>

        <DownloadModal
          isOpen={isDownloadModalOpen}
          onClose={closeDownloadModal}
          documentName={selectedDocumentName}
        />

        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={closeConfirmationModal}
          onRedo={handleRedo}
          onConfirm={handleConfirm}
          message={confirmationMessage}
          isError={isConfirmationError}
          isFinalUserUploadConfirmation={!!stagedUserDocument && !isConfirmationError}
          userType={userType}
        />

        {userType === 'user' && (
          <UploadDetailsModal
            isOpen={isUploadDetailsModalOpen}
            onClose={closeUploadDetailsModal}
            onSubmit={handleAddUserDocumentSubmit}
            uploadedFileName={uploadedFileNameForModal}
            onRedoUpload={handleRedoUploadForUser}
          />
        )}
      </div>
    </div>
  );
}

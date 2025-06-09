import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Time "mo:base/Time";

actor CertifiBackend {
    public type FileDetails = {
        fileName: Text;
        fileHash: Text;
        uploadTime: Int;
        fileContent: [Nat8];
        institutionId: Text;
    };

    private stable var fileCounter: Nat = 0;
    private var files = HashMap.HashMap<Nat, FileDetails>(0, Nat.equal, Nat.hash);

    // Upload a file
    public shared(msg) func uploadFile(
        fileName: Text,
        fileContent: [Nat8],
        institutionId: Text,
        fileHash: Text
    ) : async { fileId: Nat } {
        let fileId = fileCounter;
        fileCounter += 1;

        let fileDetails: FileDetails = {
            fileName = fileName;
            fileHash = fileHash;
            uploadTime = Time.now();
            fileContent = fileContent;
            institutionId = institutionId;
        };

        files.put(fileId, fileDetails);
        return { fileId = fileId };
    };

    // Get file details
    public query func getFileDetails(fileId: Nat) : async ?FileDetails {
        files.get(fileId)
    };

    // List all files for an institution
    public query func getInstitutionFiles(institutionId: Text) : async [FileDetails] {
        let institutionFiles = Buffer.Buffer<FileDetails>(0);
        for ((_, file) in files.entries()) {
            if (file.institutionId == institutionId) {
                institutionFiles.add(file);
            };
        };
        Buffer.toArray(institutionFiles)
    };

    // Download file content
    public query func downloadFile(fileId: Nat) : async ?[Nat8] {
        switch (files.get(fileId)) {
            case (?file) { ?file.fileContent };
            case null { null };
        }
    };

    // Delete a file
    public shared(msg) func deleteFile(fileId: Nat) : async Bool {
        switch (files.get(fileId)) {
            case (?file) {
                if (file.institutionId == Principal.toText(msg.caller)) {
                    ignore files.remove(fileId);
                    true
                } else { false }
            };
            case null { false };
        }
    };

    // Helper function to get all files (for testing)
    public query func getAllFiles() : async [(Nat, FileDetails)] {
        Iter.toArray(files.entries())
    };
}
EOL

# Create the Candid interface
cat > backend/src/main.did << 'EOL'
type FileDetails = record {
    fileName: text;
    fileHash: text;
    uploadTime: int;
    fileContent: vec nat8;
    institutionId: text;
};

service : {
    // Institution File Functions
    uploadFile: (text, vec nat8, text, text) -> (record { fileId: nat });
    getFileDetails: (nat) -> (opt FileDetails) query;
    getInstitutionFiles: (text) -> (vec FileDetails) query;
    downloadFile: (nat) -> (opt vec nat8) query;
    deleteFile: (nat) -> (bool);
    // Helper function for testing
    getAllFiles: () -> (vec record { nat; FileDetails }) query;
}
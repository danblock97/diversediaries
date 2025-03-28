const Comment = ({ comment, isReply = false, onReply }) => {
  // Prefer display_name then email; if neither is available, use "Anonymous"
  const name =
    comment.profiles?.display_name || comment.profiles?.email || "Anonymous";

  return (
    <div
      className={`bg-white rounded-lg ${
        isReply ? "border-l-4 border-gray-200 pl-4" : "shadow-sm"
      } p-6 mb-4`}
    >
      <div className="flex flex-col sm:flex-row items-start">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full overflow-hidden mb-4 sm:mb-0 sm:mr-4">
          {comment.profiles?.avatar_url ? (
            <img
              src={comment.profiles.avatar_url}
              alt="Commenter"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <div>
              <p className="font-medium text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="prose prose-sm max-w-full">
            <p className="text-gray-800 whitespace-pre-line">
              {comment.content}
            </p>
          </div>
          <div className="mt-3">
            <button
              onClick={() => onReply(comment.id)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;

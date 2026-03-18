let onlineUsers = new Map();

module.exports = {
  setOnlineUsers: map => {
    onlineUsers = map;
  },
  isUserOnline: userId => {
    return onlineUsers.has(Number(userId));
  },
};

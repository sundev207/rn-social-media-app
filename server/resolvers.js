const shortid = require("shortid");
const db = require("./db");

const resolvers = {
  Status: {
    user: status => {
      return db
        .get("users")
        .find({ _id: status.userId })
        .value();
    },
    isLiked: (status, args, context) => {
      return db.get(`likes.${context.userId}`, {}).value()[status._id] || false;
    }
  },

  Query: {
    feed: () => {
      return db
        .get("feed")
        .filter(o => o.parentPostId === null || o.parentPostId === undefined)
        .orderBy("publishedAt", "desc")
        .value();
    },

    responses: (parent, args) => {
      const originalStatus = db
        .get("feed")
        .find({ _id: args._id })
        .value();

      const responses = db
        .get("feed")
        .filter({ parentPostId: args._id })
        .orderBy("publishedAt", "desc")
        .value();

      return [originalStatus, ...responses];
    }
  },

  Mutation: {
    createStatus: (parent, { status }, context) => {
      const _id = shortid.generate();

      db.get("feed")
        .push({
          _id,
          parentPostId: status.parentPostId,
          userId: context.userId,
          status: status.status,
          publishedAt: new Date().toISOString()
        })
        .write();

      return db
        .get("feed")
        .find({ _id })
        .value();
    },

    likeStatus: (parent, { statusId }, context) => {
      const key = `likes.${context.userId}`;
      const currentLikes = db.get(key, {}).value();
      const currentLikeStatus = currentLikes[statusId] || false;
      db.set(key, {
        ...currentLikes,
        [statusId]: !currentLikeStatus
      }).write();

      return db
        .get("feed")
        .find({ _id: statusId })
        .value();
    }
  }
};

module.exports = resolvers;

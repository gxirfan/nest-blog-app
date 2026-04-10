export class VoteCreatedEvent {
  constructor(
    public readonly postId: number,
    public readonly postTitle: string,
    public readonly postSlug: string,
    public readonly voterId: number,
    public readonly voterUsername: string,
    public readonly voterNickname: string,
    public readonly direction: number,
    public readonly postOwnerId: number,
  ) {}
}

export class ReplyCreatedEvent {
  constructor(
    public readonly parentPostId: number,
    public readonly parentPostTitle: string,
    public readonly parentPostSlug: string,
    public readonly replyId: number,
    public readonly replySlug: string,
    public readonly replierId: number,
    public readonly replierUsername: string,
    public readonly replierNickname: string,
    public readonly postOwnerId: number,
  ) {}
}

export class FlowRepliedEvent {
  constructor(
    public readonly replierId: number,
    public readonly replierNickname: string,
    public readonly recipientId: number,
    public readonly parentContent: string,
    public readonly replySlug: string,
    public readonly replyId: number,
  ) {}
}

export class UserFollowedEvent {
  constructor(
    public readonly followerId: number,
    public readonly followerUsername: string,
    public readonly followerNickname: string,
    public readonly followingId: number,
  ) {}
}

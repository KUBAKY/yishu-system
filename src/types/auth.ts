export type Membership = "trial" | "subscriber" | "expired";

export type UserProfile = {
  name: string;
  gender: "男" | "女";
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  currentResidence?: string;
  pastResidences?: string;
  experienceNarrative?: string;
  currentStatus?: string;
  futureVision?: string;
};

export type AuthUser = {
  id: string;
  phone: string;
  membership: Membership;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  profile?: UserProfile;
};

export type AuthMeResponse =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      user: AuthUser;
    };

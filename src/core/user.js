export class UserManager {
	constructor(callbacks) {
		this.userInfo = null;
		this.callbacks = callbacks;
	}

	setUserInfo(userInfo) {
		this.userInfo = userInfo;
		if (this.callbacks.onUserInfoUpdate) {
			this.callbacks.onUserInfoUpdate(this.userInfo);
		}
	}

	getUserInfo() {
		return this.userInfo;
	}

	updateFarmResult(type, farmedAmount) {
		if (!this.userInfo) {
			return;
		}

		switch (type) {
			case 'gem':
				this.userInfo = { ...this.userInfo, gems: this.userInfo.gems + farmedAmount };
				if (this.callbacks.onNotify) {
					this.callbacks.onNotify(`You got ${farmedAmount} gem!!!`);
				}
				break;
			case 'xp':
				this.userInfo = { ...this.userInfo, totalXp: this.userInfo.totalXp + farmedAmount };
				if (this.callbacks.onNotify) {
					this.callbacks.onNotify(`You got ${farmedAmount} XP!!!`);
				}
				break;
			case 'streak':
				this.userInfo = { ...this.userInfo, streak: this.userInfo.streak + farmedAmount };
				if (this.callbacks.onNotify) {
					this.callbacks.onNotify(`You got ${farmedAmount} streak! (maybe some xp too, idk)`);
				}
				break;
		}

		if (this.callbacks.onUserInfoUpdate) {
			this.callbacks.onUserInfoUpdate(this.userInfo);
		}
	}
}


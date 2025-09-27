import { ApiManager } from './apiManager.js';

export class CharacterImageService {
  constructor(getAccessTokenSilently) {
    this.apiManager = new ApiManager(getAccessTokenSilently);
  }

  uploadImage(payload) {
    return this.apiManager.request('upload-character-image', {
      method: 'POST',
      body: payload,
    });
  }

  deleteImage(payload) {
    return this.apiManager.request('delete-character-image', {
      method: 'POST',
      body: payload,
    });
  }
}

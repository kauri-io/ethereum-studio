// Copyright 2019 Superblocks AB
//
// This file is part of Superblocks Lab.
//
// Superblocks Lab is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation version 3 of the License.
//
// Superblocks Lab is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Superblocks Lab.  If not, see <http://www.gnu.org/licenses/>.

import { fetchJSON, getRefreshToken } from './utils/fetchJson';
import { catchError, switchMap, tap, map } from 'rxjs/operators';
import { userService } from '../services';
import { EMPTY, throwError } from 'rxjs';

export const authService = {

    githubAuth(data: any) {
        const code = data.code;
        const userDevice = this.getUserDeviceInfo();

        return fetchJSON(process.env.REACT_APP_API_BASE_URL + '/auth/github', {
            method: 'POST',
            body: {code, userDevice},
        }).pipe(
            switchMap(r => (r.ok ? r.json() : throwError(r.statusText))),
            tap(jsonData => fetchJSON.setAuthTokens(jsonData.token, jsonData.refreshToken)),
            catchError(err => {
                throw err;
            })
        );
    },

    refreshAuth() {
        const refreshToken = getRefreshToken();
        if (refreshToken === null) {
            throw Error('RefreshToken is not available');
        }
        return fetchJSON(process.env.REACT_APP_API_BASE_URL + '/auth/refreshToken', {
            method: 'POST',
            body: { refreshToken }
        }).pipe(
            switchMap(r => (r.ok ? r.json() : throwError('Invalid refreshToken'))),
            tap(jsonData => fetchJSON.setAuthToken(jsonData.token)),
            catchError(err => {
                // Delete invalid refreshToken
                fetchJSON.clearAuthTokens();
                throw Error(err);
            })
        );
    },

    logout() {
        const refreshToken = getRefreshToken();
        if (refreshToken === null) {
            return EMPTY;
        }
        return fetchJSON(process.env.REACT_APP_API_BASE_URL + '/auth/refreshToken', {
            method: 'DELETE',
            body: { refreshToken }
        }).pipe(
            switchMap(r => (r.ok ? r.json() : EMPTY)),
            catchError(err => {
                throw Error(err);
            })
        );
    },

    getUserDeviceInfo() {
        const platform = require('platform');
        const isMobile = this.isMobile();
        return {os: platform.os.family, isMobile, userAgent: navigator.userAgent};
    },

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
};
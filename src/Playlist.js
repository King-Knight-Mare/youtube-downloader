let rp = require('request-promise')
let request = require('request')
/**
* Playlist class
* @class
* @property {string} id - Id of playlist
* @property {string} title - Title of playlist
* @property {string} _description - Truncated description of playlist
* @property {string} description - Description of playlist
* @property {object} thumbnails - Thumbnails of playlist
* @property {string} channel - Channel of playlist
* @property {string} url - URL of playlist
*/
class Playlist  {
    constructor(details, apiKey){
        if(details.kind == 'youtube#searchResult'){
            this.type = 'playlist'
            this.id = details.id.playlistId
            this.title = details.snippet.title
            this._description = details.snippet.description
            this.thumbnails = details.snippet.thumbnails
            this.channel = details.snippet.channelTitle
            this.url = `https://youtube.com/playlist?list=${this.id}`
        }
    }
}
module.exports = Playlist
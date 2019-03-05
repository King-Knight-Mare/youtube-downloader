let rp = require('request-promise')
let request = require('request')
/**
* Video class
* @class
* @property {string} id - Id of video
* @property {string} title - Title of video
* @property {string} _description - Truncated description of video
* @property {string} description - Description of video
* @property {object} thumbnails - Thumbnails of video
* @property {string} channel - Channel of video
* @property {string} url - URL of video
*/
class Video  {
    constructor(details, apiKey){
        if(details.kind == 'youtube#searchResult'){
            this.type = 'video'
            this.id = details.id.videoId
            this.title = details.snippet.title
            this._description = details.snippet.description
            this.thumbnails = details.snippet.thumbnails
            this.channel = details.snippet.channelTitle
            this.url = `https://youtube.com/watch?v=${this.id}`
            
        }
    }
    
}
module.exports = Video
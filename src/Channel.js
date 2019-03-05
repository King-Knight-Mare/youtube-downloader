let rp = require('request-promise')
let request = require('request')
/**
* Channel class
* @class
* @property {string} id - Id of channel
* @property {string} title - Title of channel
* @property {string} _description - Truncated description of channel
* @property {object} thumbnails - Thumbnails of channel
* @property {string} url - URL of channel
*/
class Channel  {
    constructor(details, apiKey){
        if(details.kind == 'youtube#searchResult'){
            this.type = 'channel'
            this.id = details.id.channelId
            this.title = details.snippet.title
            this._description = details.snippet.description
            this.thumbnails = details.snippet.thumbnails
        }
    }
    
}
module.exports = Channel
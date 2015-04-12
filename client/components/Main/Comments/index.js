
var React = require('react-native');

var MessageFooter = require('./MessageFooter.js');
var CommentFooter = require('./CommentFooter.js');
var CommentsHeader = require('./CommentsHeader.js')

var styles = require('../../../styles.js');

var {View, Text, Image, ListView, TouchableOpacity} = React;

class Comments extends React.Component {

  constructor(props){
    super(props);

    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      loaded: false,
    };
  }

  componentDidMount(){
    this.fetchData()
  }

  render(){
    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderMessage.bind(this)}
        style={{backgroundColor: '#D7E1EE', height: 400}}
        initialListSize={10}
        pageSize={4}
        scrollRenderAheadDistance={2000} 
        renderSectionHeader={this.renderSectionHeader.bind(this)}
      />
    );
  }

  renderMessage(body) {
    return(
      <View>
        <View 
          style={[styles.row, body.origin ? 
            styles.messageContainer : 
            styles.commentContainer]} >
          <View>
            <Text></Text>
            <Text style={body.origin ? 
              styles.messageText : 
              styles.commentText} >
              {body.commentString}
            </Text>
            <Text></Text>
            <Text></Text>
          </View>
          { body.origin ? 
          <MessageFooter 
            timestamp={body.timestamp} 
            distance={body.distance} 
            numHearts={body.numHearts ? body.numHearts : null}
            userToken={this.props.userToken}
            messageId={this.props.messageId}
            fetchMessages={this.props.fetchMessages} 
          /> : 
          <CommentFooter 
            timestamp={body.timestamp} 
            distance={body.distance} 
            userToken={this.props.userToken}
            messageId={this.props.messageId} 
          /> }
        </View>
      </View>
    )
    
  }

  renderSectionHeader(data, sectionID){
    return (
      <CommentsHeader
        navigator={this.props.navigator}
        userToken={this.props.userToken}
        messageId={this.props.messageId}
        fetchComments={this.fetchData.bind(this)}
      />
    );
  }

  fetchData(){

    var originMessage = {
      origin: true, 
      commentString:this.props.messageString, 
      timestamp: this.props.timestamp, 
      distance: this.props.distance,
      numComments: this.props.numComments,
      numHearts: this.props.numHearts,
    }
 
    fetch('http://uncovery.cloudapp.net/comment/?messageId='+this.props.messageId)
      .then((response) => response.json())
      .then((responseData) => {
        responseData.unshift(originMessage)
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(responseData),
          loaded: true,
        });

        this.render();
      })
      .done();

    this.setState({
      dataSource: this.state.dataSource.cloneWithRows([originMessage]),
    })    
  }

}

var heartImage = {uri: 'https://pbs.twimg.com/media/BlXBfT3CQAA6cVZ.png:small'};

module.exports = Comments;

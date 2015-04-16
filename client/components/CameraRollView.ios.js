'use strict';

var styles = require('../styles.js');
var React = require('react-native');

var {
  CameraRoll,
  Image,
  ListView,
  StyleSheet,
  View,
  TouchableHighlight,
} = React;

var groupByEveryN = require('groupByEveryN');
var logError = require('logError');

var propTypes = {
  groupTypes: React.PropTypes.oneOf([
    'Album',
    'All',
    'Event',
    'Faces',
    'Library',
    'PhotoStream',
    'SavedPhotos',
  ]),
  batchSize: React.PropTypes.number,
  renderImage: React.PropTypes.func,
  imagesPerRow: React.PropTypes.number,
};

var CameraRollView = React.createClass({
  propTypes: propTypes,

  getDefaultProps: function(): Object {
    var self = this;
    return {
      groupTypes: 'SavedPhotos',
      batchSize: 6,
      imagesPerRow: 2,
      renderImage: function(asset) {
        var imageSize = 180;
        var imageStyle = [styles.image, {width: imageSize, height: imageSize}];

        return (
          <TouchableHighlight>
          <Image
            source={asset.node.image}
            style={imageStyle}
          />
          </TouchableHighlight>
        );
      },
    };
  },

  getInitialState: function() {
    var ds = new ListView.DataSource({rowHasChanged: this._rowHasChanged});

    return {
      assets: ([]: Array<Image>),
      groupTypes: this.props.groupTypes,
      lastCursor: (null : ?string),
      noMore: false,
      loadingMore: false,
      dataSource: ds,
    };
  },

  rendererChanged: function() {
    var ds = new ListView.DataSource({rowHasChanged: this._rowHasChanged});
    this.state.dataSource = ds.cloneWithRows(
      groupByEveryN(this.state.assets, this.props.imagesPerRow)
    );
  },

  componentDidMount: function() {
    this.fetch();
  },

  componentWillReceiveProps: function(nextProps: {groupTypes?: string}) {
    if (this.props.groupTypes !== nextProps.groupTypes) {
      this.fetch(true);
    }
  },

  _fetch: function(clear?: boolean) {
    if (clear) {
      this.setState(this.getInitialState(), this.fetch);
      return;
    }

    var fetchParams: Object = {
      first: this.props.batchSize,
      groupTypes: this.props.groupTypes
    };
    if (this.state.lastCursor) {
      fetchParams.after = this.state.lastCursor;
    }

    CameraRoll.getPhotos(fetchParams, this._appendAssets, logError);
  },

  fetch: function(clear?: boolean) {
    if (!this.state.loadingMore) {
      this.setState({loadingMore: true}, () => { this._fetch(clear); });
    }
  },

  render: function() {
    return (
      <ListView
        renderRow={this._renderRow}
        renderFooter={this._renderFooterSpinner}
        style={styles.container}
        dataSource={this.state.dataSource}
      />
    );
  },

  _rowHasChanged: function(r1: Array<Image>, r2: Array<Image>): boolean {
    if (r1.length !== r2.length) {
      return true;
    }

    for (var i = 0; i < r1.length; i++) {
      if (r1[i] !== r2[i]) {
        return true;
      }
    }

    return false;
  },

  _renderFooterSpinner: function() {
    return null;
  },

  // rowData is an array of images
  _renderRow: function(rowData: Array<Image>, sectionID: string, rowID: string)  {
    var images = rowData.map((image) => {
      if (image === null) {
        return null;
      }
      return this.props.renderImage(image);
    });

    return (
      <View style={styles.row}>
        {images}
      </View>
    );
  },

  _appendAssets: function(data: Object) {
    var assets = data.edges;
    var newState: Object = { loadingMore: false };

    if (!data.page_info.has_next_page) {
      newState.noMore = true;
    }

    if (assets.length > 0) {
      newState.lastCursor = data.page_info.end_cursor;
      newState.assets = this.state.assets.concat(assets);
      newState.dataSource = this.state.dataSource.cloneWithRows(
        groupByEveryN(newState.assets, this.props.imagesPerRow)
      );
    }

    this.setState(newState);
  },

});

module.exports = CameraRollView;

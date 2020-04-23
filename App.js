import React from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import MapView, {Marker, AnimatedRegion} from 'react-native-maps';
import PubNubReact from 'pubnub-react';

const {width, height} = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: LATITUDE,
      longitude: LONGITUDE,
      coordinate: new AnimatedRegion({
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: 0,
        longitudeDelta: 0,
      }),
    };

    this.pubnub = new PubNubReact({
      publishKey: 'pub-c-0a6f9a83-d550-4ca2-aca4-dddf3ec1fa0e',
      subscribeKey: 'sub-c-8cba90fc-6b88-11ea-bfec-9ea4064cf66f',
    });
    // console.log('pubnub', this.pubnub);
    this.pubnub.init(this);
  }

  componentWillMount() {
    try {
      this.pubnub.subscribe({
        channels: ['CHANNEL'],
        withPresence: true,
      });
      this.pubnub.getStatus(status => {
        console.log('status', status);
      });
      // console.log('CHECK CHANNEL');
      this.pubnub.getMessage('CHANNEL', msg => {
        console.log('CHANNEL', msg);
        const {coordinate} = this.state;
        const {latitude, longitude} = msg.message;
        const newCoordinate = {latitude, longitude};

        if (Platform.OS === 'android') {
          if (this.marker) {
            this.marker._component.animateMarkerToCoordinate(
              newCoordinate,
              500,
            );
          }
        } else {
          coordinate.timing(newCoordinate).start();
        }

        this.setState({
          latitude,
          longitude,
        });
      });
    } catch (error) {
      console.log('CHANNEL ERROR', error.message);
    }
  }

  // componentDidUpdate(prevProps, prevState) {
  //   if (this.props.latitude !== prevState.latitude) {
  //     this.pubnub.publish({
  //       message: {
  //         latitude: this.state.latitude,
  //         longitude: this.state.longitude,
  //       },
  //       channel: 'CHANNEL',
  //     });
  //   }
  // }
  componentWillUnmount() {
    this.pubnub.unsubscribe({
      channels: ['CHANNEL'],
    });
  }

  getMapRegion = () => ({
    latitude: this.state.latitude,
    longitude: this.state.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  render() {
    return (
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          <MapView
            style={styles.map}
            showUserLocation
            followUserLocation
            loadingEnabled
            region={this.getMapRegion()}>
            <Marker.Animated
              ref={marker => {
                this.marker = marker;
              }}
              coordinate={this.state.coordinate}
            />
          </MapView>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

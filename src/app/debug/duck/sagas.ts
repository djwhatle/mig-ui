import { select, put, takeEvery, delay, call, race, take } from 'redux-saga/effects';
import { ClientFactory } from '../../../client/client_factory';
import { IDiscoveryClient } from '../../../client/discoveryClient';
import { IReduxState } from '../../../reducers';
import { DebugTreeDiscoveryResource } from '../../../client/resources/discovery';
import { IDiscoveryResource } from '../../../client/resources/common';
import {
  debugObjectFetchFailure,
  debugObjectFetchRequest,
  debugObjectFetchSuccess,
  startDebugPolling,
  stopDebugPolling,
  treeFetchFailure,
  treeFetchRequest,
  treeFetchSuccess,
  debugRefsFetchFailure,
  debugRefsFetchRequest,
  debugRefsFetchSuccess,
} from './slice';
import { alertErrorTimeout } from '../../common/duck/slice';

function* fetchDebugRefs(action) {
  const state: IReduxState = yield select();
  const discoveryClient: IDiscoveryClient = ClientFactory.discovery(state);
  const linkRefs = [];
  const eachRecursive = (obj) => {
    for (const k in obj) {
      if (typeof obj[k] == 'object' && obj[k] !== null) {
        eachRecursive(obj[k]);
      } else {
        if (k === 'objectLink') {
          linkRefs.push({ link: obj[k], kind: obj['kind'] });
        }
      }
    }
  };
  eachRecursive(action.payload);

  const refs: Array<Promise<any>> = linkRefs.map(function (linkRef) {
    return discoveryClient.getRaw(linkRef.link).then(function (value) {
      return {
        kind: linkRef.kind,
        value: value,
      };
    });
  });

  try {
    const debugRefs = yield Promise.all(refs);
    yield put(debugRefsFetchSuccess(debugRefs));
  } catch (err) {
    yield put(debugRefsFetchFailure(err.message));
    yield put(alertErrorTimeout(`Failed to fetch debug ref: ${err.message}`));
  }
}

function* fetchDebugObject(action) {
  const state: IReduxState = yield select();
  const discoveryClient: IDiscoveryClient = ClientFactory.discovery(state);

  try {
    const res = yield discoveryClient.getRaw(action.payload);
    yield put(debugObjectFetchSuccess(res.data));
  } catch (err) {
    yield put(debugObjectFetchFailure(err.message));
    yield put(alertErrorTimeout(`Failed to fetch debug tree: ${err.message}`));
  }
}

function* fetchDebugTree(action) {
  const planName: string = action.payload;
  const state: IReduxState = yield select();
  const discoveryClient: IDiscoveryClient = ClientFactory.discovery(state);
  const debugTreeResource: IDiscoveryResource = new DebugTreeDiscoveryResource(planName);

  try {
    const res = yield discoveryClient.get(debugTreeResource);

    yield put(debugRefsFetchRequest(res.data));
    yield take(debugRefsFetchSuccess);
    yield put(treeFetchSuccess(res.data));
  } catch (err) {
    yield put(treeFetchFailure(err.message));
    yield put(alertErrorTimeout(`Failed to fetch debug tree: ${err.message}`));
  }
}
function* debugPoll(action) {
  const planName = action.payload;
  while (true) {
    try {
      yield put(treeFetchRequest(planName));
      yield take(treeFetchSuccess);
      yield delay(10000);
    } catch {
      yield put(stopDebugPolling);
    }
  }
}

function* watchDebugPolling() {
  while (true) {
    const data = yield take(startDebugPolling.type);
    yield race([call(debugPoll, data), take(stopDebugPolling.type)]);
  }
}
function* watchDebugTreeFetchRequest() {
  yield takeEvery(treeFetchRequest.type, fetchDebugTree);
}

function* watchDebugRefsFetchRequest() {
  yield takeEvery(debugRefsFetchRequest.type, fetchDebugRefs);
}

function* watchDebugObjectFetchRequest() {
  yield takeEvery(debugObjectFetchRequest.type, fetchDebugObject);
}

export default {
  watchDebugTreeFetchRequest,
  watchDebugObjectFetchRequest,
  watchDebugPolling,
  watchDebugRefsFetchRequest,
};

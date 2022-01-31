import React, { useState, useEffect } from 'react';
import find from 'lodash/find';
import QueryUrl from '../QueryUrl';
import GraphQLRequestPane from '../GraphQLRequestPane';
import HttpRequestPane from '../HttpRequestPane';
import ResponsePane from '../ResponsePane';
import Welcome from '../Welcome';
import {
  flattenItems,
  findItem
} from '../../utils';
import useGraphqlSchema from '../../hooks/useGraphqlSchema';

import StyledWrapper from './StyledWrapper';

const RequestTabPanel = ({dispatch, actions, collections, activeRequestTabId, requestTabs}) => {
  if(typeof window == 'undefined') {
    return <div></div>;
  }

  let asideWidth = 270;
  let {
    schema 
  } = useGraphqlSchema('https://api.spacex.land/graphql');
  const [leftPaneWidth, setLeftPaneWidth] = useState((window.innerWidth - asideWidth)/2 - 10); // 10 is for dragbar
  const [rightPaneWidth, setRightPaneWidth] = useState((window.innerWidth - asideWidth)/2);
  const [dragging, setDragging] = useState(false);
  const handleMouseMove = (e) => {
    if(dragging) {
      e.preventDefault();
      setLeftPaneWidth(e.clientX - asideWidth);
      setRightPaneWidth(window.innerWidth - (e.clientX));
    }
  };
  const handleMouseUp = (e) => {
    if(dragging) {
      e.preventDefault();
      setDragging(false);
    }
  };
  const handleDragbarMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragging, leftPaneWidth]);

  const onUrlChange = (value) => {
    dispatch({
      type: actions.REQUEST_URL_CHANGED,
      url: value,
      requestTab: focusedTab,
      collectionId: collection ? collection.id : null
    });
  };

  const onGraphqlQueryChange = (value) => {
    dispatch({
      type: actions.REQUEST_GQL_QUERY_CHANGED,
      query: value,
      requestTab: focusedTab,
      collectionId: collection ? collection.id : null
    });
  };

  if(!activeRequestTabId) {
    return (
      <Welcome dispatch={dispatch} actions={actions}/>
    );
  }

  const focusedTab = find(requestTabs, (rt) => rt.id === activeRequestTabId);

  if(!focusedTab || !focusedTab.id) {
    return (
      <div className="pb-4 px-4">An error occured!</div>
    );
  }

  let collection;
  let item;

  if(focusedTab.collectionId) {
    collection = find(collections, (c) => c.id === focusedTab.collectionId);
    let flattenedItems = flattenItems(collection.items);
    item = findItem(flattenedItems, activeRequestTabId);
  } else {
    item = focusedTab;
  }

  const runQuery = async () => {
    dispatch({
      type: actions.SEND_REQUEST,
      requestTab: focusedTab,
      collectionId: collection ? collection.id : null
    });
  };

  return (
    <StyledWrapper className="flex flex-col flex-grow">
      <div
        className="pb-4 px-4"
        style={{
          borderBottom: 'solid 1px var(--color-layout-border)'
        }}
      >
        <div className="pt-2 text-gray-600">{item.name}</div>
        <QueryUrl
          value = {item.request.url}
          onChange={onUrlChange}
          handleRun={runQuery}
          collections={collections}
        />
      </div>
      <section className="main flex flex-grow">
        <section className="request-pane">
          <div
            className="px-4"
            style={{width: `${leftPaneWidth}px`, height: 'calc(100% - 5px)'}}
          >
            {item.request.type === 'graphql' ? (
              <GraphQLRequestPane
                onRunQuery={runQuery}
                schema={schema}
                leftPaneWidth={leftPaneWidth}
                value={item.request.body.graphql.query}
                onQueryChange={onGraphqlQueryChange}
              />
            ) : null}

            {item.request.type === 'http' ? (
              <HttpRequestPane
                leftPaneWidth={leftPaneWidth}
              />
            ) : null}
          </div>
        </section>

        <div className="drag-request" onMouseDown={handleDragbarMouseDown}>
        </div>

        <section className="response-pane flex-grow">
          <ResponsePane
            rightPaneWidth={rightPaneWidth}
            response={item.response}
            isLoading={item.response && item.response.state === 'sending' ? true : false}
          />
        </section>
      </section>
    </StyledWrapper>
  )
};

export default RequestTabPanel;

import React, { useState } from 'react';
import StorageItem from './StorageItem';
import { Flex, Box } from '@rebass/emotion';
import AddStorageModal from '../../../../storage/components/AddStorageModal';
import {
  DataList,
  DataListContent,
  Button,
  Title,
  EmptyState,
  EmptyStateIcon,
} from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';

const StorageContent = ({
  dataList,
  isLoading,
  isExpanded,
  associatedPlans,
  removeStorage,
  ...props
}) => {
  const [isOpen, toggleOpen] = useState(false);
  return (
    <DataListContent noPadding aria-label="storage-items-content-container" isHidden={!isExpanded}>
      {dataList.length > 0 ? (
        <DataList aria-label="storage-item-list">
          {dataList.map((storage, storageIndex) => {
            return (
              <StorageItem
                key={storageIndex}
                isLoading
                storage={storage}
                storageIndex={storageIndex}
                associatedPlans={associatedPlans}
                removeStorage={removeStorage}
              />
            );
          })}
        </DataList>
      ) : (
        <Flex alignItems="center" justifyContent="center">
          <Box>
            <EmptyState variant="large">
              <EmptyStateIcon icon={AddCircleOIcon} />
              <Title size="lg">Add replication repositories for the migration</Title>
              <Button onClick={() => toggleOpen(!isOpen)} variant="primary">
                Add Repository
              </Button>
              <AddStorageModal isOpen={isOpen} onHandleClose={toggleOpen} />
            </EmptyState>
          </Box>
        </Flex>
      )}
    </DataListContent>
  );
};
export default StorageContent;

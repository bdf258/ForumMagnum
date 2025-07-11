import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components'
import { getSearchIndexName } from '../../lib/search/searchUtil';
import SearchAutoComplete from "./SearchAutoComplete";
import SequencesSearchHit from "./SequencesSearchHit";

const SequencesSearchAutoComplete = ({clickAction}: {
  clickAction: (id: string) => void
}) => {
  return <SearchAutoComplete
    indexName={getSearchIndexName("Sequences")}
    clickAction={clickAction}
    renderSuggestion={(hit: any) => <SequencesSearchHit hit={hit} clickAction={clickAction} />}
    placeholder='Search for sequences'
    hitsPerPage={3}
    noSearchPlaceholder='Sequence ID'
  />
}

export default registerComponent("SequencesSearchAutoComplete", SequencesSearchAutoComplete);




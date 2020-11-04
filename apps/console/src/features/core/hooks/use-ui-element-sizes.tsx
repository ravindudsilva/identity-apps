/**
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { useEffect, useState } from "react";
import { UIConstants } from "../constants";

/**
 * Hook to get specifics ui elements sizes.
 *
 * @return {object} - headerHeight, footerHeight
 */
export const useUIElementSizes = () => {

    const [ headerHeight, setHeaderHeight ] = useState<number>(UIConstants.DEFAULT_HEADER_HEIGHT);
    const [ footerHeight, setFooterHeight ] = useState<number>(UIConstants.DEFAULT_FOOTER_HEIGHT);

    const appHeader = document.getElementById("app-header");
    const appFooter = document.getElementById("app-footer");

    useEffect(() => {
        if (headerHeight === appHeader?.offsetHeight) {
            return;
        }
        setHeaderHeight(appHeader?.offsetHeight - UIConstants.AJAX_TOP_LOADING_BAR_HEIGHT);
    });

    useEffect(() => {
        if (footerHeight === appFooter?.offsetHeight) {
            return;
        }
        setFooterHeight(appFooter?.offsetHeight);
    });

    return { headerHeight, footerHeight };
}

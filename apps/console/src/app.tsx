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

import { CommonHelpers, isPortalAccessGranted } from "@wso2is/core/helpers";
import { RouteInterface, emptyIdentityAppsSettings } from "@wso2is/core/models";
import {
    setDeploymentConfigs,
    setI18nConfigs,
    setServiceResourceEndpoints,
    setUIConfigs
} from "@wso2is/core/store";
import { LocalStorageUtils } from "@wso2is/core/utils";
import { I18n, I18nModuleOptionsInterface } from "@wso2is/i18n";
import { ContentLoader, SessionManagementProvider, ThemeContext } from "@wso2is/react-components";
import _ from "lodash";
import React, { FunctionComponent, ReactElement, Suspense, useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { I18nextProvider } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import { initializeAuthentication } from "./features/authentication";
import { ProtectedRoute } from "./features/core/components";
import { Config, getBaseRoutes } from "./features/core/configs";
import { AppConstants } from "./features/core/constants";
import { history } from "./features/core/helpers";
import {
    ConfigReducerStateInterface,
    DeploymentConfigInterface,
    FeatureConfigInterface,
    ServiceResourceEndpointsInterface,
    UIConfigInterface
} from "./features/core/models";
import { AppState } from "./features/core/store";

/**
 * Main App component.
 *
 * @return {React.ReactElement}
 */
export const App: FunctionComponent<{}> = (): ReactElement => {

    const { state } = useContext(ThemeContext);

    const dispatch = useDispatch();

    const userName: string = useSelector((state: AppState) => state.auth.username);
    const loginInit: boolean = useSelector((state: AppState) => state.auth.loginInit);
    const config: ConfigReducerStateInterface = useSelector((state: AppState) => state.config);
    const allowedScopes: string = useSelector((state: AppState) => state?.auth?.scope);

    const [ baseRoutes, setBaseRoutes ] = useState<RouteInterface[]>(getBaseRoutes());

    /**
     * Set the deployment configs in redux state.
     */
    useEffect(() => {
        dispatch(initializeAuthentication());
    }, []);

    /**
     * Set the deployment configs in redux state.
     */
    useEffect(() => {
        // Replace `RuntimeConfigInterface` with the proper deployment config interface,
        // once runtime config is refactored.
        dispatch(setDeploymentConfigs<DeploymentConfigInterface>(Config.getDeploymentConfig()));
        dispatch(setServiceResourceEndpoints<ServiceResourceEndpointsInterface>(Config.getServiceResourceEndpoints()));
        dispatch(setI18nConfigs<I18nModuleOptionsInterface>(Config.getI18nConfig()));
        dispatch(setUIConfigs<UIConfigInterface>(Config.getUIConfig()));
        dispatch(initializeAuthentication());
    }, []);

    /**
     * Listen for base name changes and updated the routes.
     */
    useEffect(() => {
        setBaseRoutes(getBaseRoutes());
    }, [ AppConstants.getTenantQualifiedAppBasename() ]);

    /**
     * Set the application settings of the user to the local storage.
     */
    useEffect(() => {
        if (!userName || !config?.deployment?.tenant) {
            return;
        }

        const tenant = config.deployment.tenant;
        const tenantAppSettings = JSON.parse(LocalStorageUtils.getValueFromLocalStorage(tenant));
        const appSettings = {};

        appSettings[userName] = emptyIdentityAppsSettings();

        if (!tenantAppSettings) {
            LocalStorageUtils.setValueInLocalStorage(tenant, JSON.stringify(appSettings));
        } else {
            if (CommonHelpers.lookupKey(tenantAppSettings, userName) === null) {
                const newUserSettings = {
                    ...tenantAppSettings,
                    [userName]: emptyIdentityAppsSettings()
                };
                LocalStorageUtils.setValueInLocalStorage(tenant, JSON.stringify(newUserSettings));
            }
        }

    }, [ config?.deployment?.tenant, userName ]);

    /**
     * Checks if the portal access should be granted based on the feature config.
     */
    useEffect(() => {
        if (!config?.ui?.features || !loginInit) {
            return;
        }

        if (isPortalAccessGranted<FeatureConfigInterface>(config?.ui?.features, allowedScopes)) {
            return;
        }

        history.push({
            pathname: AppConstants.PATHS.get("UNAUTHORIZED"),
            search: "?error=" + AppConstants.LOGIN_ERRORS.get("ACCESS_DENIED")
        });
    }, [ config, loginInit ]);

    /**
     * Handles session timeout abort.
     *
     * @param {URL} url - Current URL.
     */
    const handleSessionTimeoutAbort = (url: URL): void => {
        history.push({
            pathname: (url.pathname).replace(config.deployment.appBaseName, ""),
            search: url.search
        });
    };

    /**
     * Handles session logout.
     */
    const handleSessionLogout = (): void => {
        history.push(config.deployment.appLogoutPath);
    };

    return (
        <>
            {
                (!_.isEmpty(config?.deployment) && !_.isEmpty(config?.endpoints))
                    ? (
                        <Router history={ history }>
                            <div className="container-fluid">
                                <I18nextProvider i18n={ I18n.instance }>
                                    <Suspense fallback={ <ContentLoader dimmer/> }>
                                        <SessionManagementProvider
                                            onSessionTimeoutAbort={ handleSessionTimeoutAbort }
                                            onSessionLogout={ handleSessionLogout }
                                            modalOptions={ {
                                                description: I18n.instance.t("console:common.modals" +
                                                    ".sessionTimeoutModal.description"),
                                                headingI18nKey: "console:common.modals.sessionTimeoutModal.heading",
                                                primaryButtonText: I18n.instance.t("console:common.modals" +
                                                    ".sessionTimeoutModal.primaryButton"),
                                                secondaryButtonText: I18n.instance.t("console:common.modals" +
                                                    ".sessionTimeoutModal.secondaryButton")
                                            } }
                                        >
                                            <>
                                                <Helmet>
                                                    <link
                                                        rel="shortcut icon"
                                                        href={ `${ window["AppUtils"].getConfig().clientOrigin }/` +
                                                        `${ window["AppUtils"].getConfig().appBase }/libs/themes/` +
                                                        `${ state.theme }/assets/images/favicon.ico` }
                                                    />
                                                    <link
                                                        href={ `${ window["AppUtils"].getConfig().clientOrigin }/` +
                                                        `${ window["AppUtils"].getConfig().appBase }/libs/themes/` +
                                                        `${ state.theme }/theme.min.css` }
                                                        rel="stylesheet"
                                                        type="text/css"
                                                    />
                                                    <style type="text/css">
                                                        { state.css }
                                                    </style>
                                                </Helmet>
                                                <Switch>
                                                    <Redirect
                                                        exact={ true }
                                                        path="/"
                                                        to={ config.deployment.appLoginPath }
                                                    />
                                                    {
                                                        baseRoutes.map((route, index) => {
                                                            return (
                                                                route.protected ?
                                                                    (
                                                                        <ProtectedRoute
                                                                            component={ route.component }
                                                                            path={ route.path }
                                                                            key={ index }
                                                                            exact={ route.exact }
                                                                        />
                                                                    )
                                                                    :
                                                                    (
                                                                        <Route
                                                                            path={ route.path }
                                                                            render={ (props) =>
                                                                                (<route.component { ...props } />)
                                                                            }
                                                                            key={ index }
                                                                            exact={ route.exact }
                                                                        />
                                                                    )
                                                            );
                                                        })
                                                    }
                                                </Switch>
                                            </>
                                        </SessionManagementProvider>
                                    </Suspense>
                                </I18nextProvider>
                            </div>
                        </Router>
                    )
                    : <ContentLoader dimmer/>
            }
        </>
    );
};
